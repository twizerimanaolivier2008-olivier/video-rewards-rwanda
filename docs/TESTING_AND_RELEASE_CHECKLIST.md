# Staging test and release checklist

## Before applying migration 003
- Confirm MySQL is version 8.0 or later.
- Take a backup and verify that it can be restored into an isolated database.
- Apply earlier project migrations first, then apply `database/migrations/003-production-ledger-security.sql` exactly once.
- Confirm the API rate-limit, video watch session, idempotency, audit and ledger tables exist.

## API tests
- Registration creates a user and pending registration-fee transaction in one database transaction.
- Login throttling returns 429 after the configured threshold; reset windows are enforced.
- Missing API rate-limit tables fail closed rather than silently bypassing throttling.
- A client-supplied payment status never upgrades an account.
- Payment initiation remains unavailable until provider integration and callbacks have been configured.
- Watch start returns an opaque session token; progress only increases from server-timed playback intervals.
- Seeking, paused tabs, expired sessions and duplicate claims do not award credit.
- Reward rows, user balance/points and transaction records commit or roll back together.
- Two concurrent withdrawal requests cannot reserve more than the available balance.
- Repeating a withdrawal with the same Idempotency-Key returns the original result and does not create a second payout.
- Admin completion requires a payout reference; failed reserved payouts refund available balance exactly once.
- Merkle proofs generated for ledger batches verify against the expected root.

## Financial reconciliation
- Ensure every posted journal has equal debit and credit totals for the same currency.
- Confirm posted journal and ledger entry rows reject UPDATE and DELETE.
- Reconcile the MySQL ledger against MTN/Airtel provider settlement reports before crediting real money.
- Verify outbox retries are idempotent and blockchain anchor events contain only hashes/roots and non-sensitive metadata.

## Release
- Run `npm ci && npm test` in `backend` and `npm ci && npm run build` in `frontend`.
- Review dependency audit findings and pin safe dependency versions.
- Test registration, login, profile, video, balance, withdrawals and admin paths in staging.
- Test provider callbacks with sandbox credentials before enabling money movement.
- Configure `API_ORIGIN` as an HTTPS origin on the Cloudflare Pages project.
- Protect the backend origin with Cloudflare Tunnel or Access and a private database network.
- Configure secrets on the host; never commit credentials.
- Rehearse rollback and database restore.

Do not launch real payments until the provider adapters, callback signatures, reconciliation and double-entry ledger integration have passed staging tests.
