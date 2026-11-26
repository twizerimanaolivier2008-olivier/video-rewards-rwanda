import { createHash } from 'node:crypto';
import pool from '../config/db.js';
import { parseMinorUnits } from '../utils/money.js';
export { parseMinorUnits } from '../utils/money.js';

const hashEntry = ({ eventId, accountId, side, amountMinor, currency, index }) =>
  createHash('sha256')
    .update([eventId, accountId, side, amountMinor.toString(), currency, index].join('|'))
    .digest('hex');

export const postLedgerJournal = async ({ eventId, eventType, reference = null, currency, metadata = {}, entries }) => {
  if (!/^[A-Z0-9:_-]{8,128}$/i.test(String(eventId || ''))) throw new TypeError('A valid unique eventId is required.');
  if (!/^[A-Z]{3}$/.test(String(currency || ''))) throw new TypeError('A three-letter currency code is required.');
  if (!Array.isArray(entries) || entries.length < 2 || entries.length > 100) {
    throw new TypeError('A journal requires between 2 and 100 entries.');
  }

  const normalized = entries.map((entry) => {
    const accountId = Number(entry.accountId);
    const side = String(entry.side || '').toLowerCase();
    if (!Number.isSafeInteger(accountId) || accountId < 1) throw new TypeError('Each ledger entry requires a valid account ID.');
    if (side !== 'debit' && side !== 'credit') throw new TypeError('Ledger side must be debit or credit.');
    return { accountId, side, amountMinor: parseMinorUnits(entry.amount) };
  });

  const debitTotal = normalized.filter((entry) => entry.side === 'debit')
    .reduce((sum, entry) => sum + entry.amountMinor, 0n);
  const creditTotal = normalized.filter((entry) => entry.side === 'credit')
    .reduce((sum, entry) => sum + entry.amountMinor, 0n);
  if (debitTotal === 0n || debitTotal !== creditTotal) {
    throw new RangeError('Ledger journal is not balanced.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    let journalId;
    try {
      const [journal] = await connection.query(
        'INSERT INTO ledger_journals (event_id, event_type, reference, currency, metadata_json) VALUES (?, ?, ?, ?, ?)',
        [eventId, eventType, reference, currency, JSON.stringify(metadata)]
      );
      journalId = journal.insertId;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        await connection.rollback();
        return { duplicate: true, eventId };
      }
      throw error;
    }

    const accountIds = [...new Set(normalized.map((entry) => entry.accountId))];
    const [accounts] = await connection.query(
      'SELECT id, currency, is_active FROM ledger_accounts WHERE id IN (?) FOR UPDATE',
      [accountIds]
    );
    const byId = new Map(accounts.map((account) => [Number(account.id), account]));
    for (const entry of normalized) {
      const account = byId.get(entry.accountId);
      if (!account || !account.is_active || account.currency !== currency) {
        throw new Error('A ledger account is missing, inactive or uses a different currency.');
      }
    }

    const entryHashes = [];
    for (let index = 0; index < normalized.length; index += 1) {
      const entry = normalized[index];
      const entryHash = hashEntry({ eventId, ...entry, currency, index });
      await connection.query(
        'INSERT INTO ledger_entries (journal_id, account_id, side, amount_minor, currency, entry_hash) VALUES (?, ?, ?, ?, ?, ?)',
        [journalId, entry.accountId, entry.side, entry.amountMinor.toString(), currency, entryHash]
      );
      entryHashes.push(entryHash);
    }

    await connection.query(
      'INSERT INTO ledger_outbox (event_id, event_type, payload_json) VALUES (?, ?, ?)',
      [eventId, eventType, JSON.stringify({ eventId, journalId, currency, entryHashes })]
    );
    await connection.commit();
    return { duplicate: false, journalId, eventId, entryHashes };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
