import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMerkleProof,
  computeMerkleRoot,
  hashTransactionPayload,
  verifyMerkleProof,
} from './merkle.js';
import { parseMinorUnits } from './money.js';

test('parseMinorUnits parses exact decimals without floating point', () => {
  assert.equal(parseMinorUnits('4750').toString(), '475000');
  assert.equal(parseMinorUnits('12.3').toString(), '1230');
  assert.equal(parseMinorUnits('0.01').toString(), '1');
});

test('parseMinorUnits rejects negative, excessive precision and zero amounts', () => {
  assert.throws(() => parseMinorUnits('-1'), TypeError);
  assert.throws(() => parseMinorUnits('1.001'), TypeError);
  assert.throws(() => parseMinorUnits('0'), RangeError);
});

test('Merkle root is deterministic and changes when a leaf changes', () => {
  const a = hashTransactionPayload({ eventId: 'TX-1', amount: '10.00' });
  const b = hashTransactionPayload({ eventId: 'TX-2', amount: '20.00' });
  const root = computeMerkleRoot([a, b]);
  assert.match(root, /^[a-f0-9]{64}$/);
  assert.equal(computeMerkleRoot([a, b]), root);
  assert.notEqual(computeMerkleRoot([a, hashTransactionPayload('altered')]), root);
});

test('Transaction payload hashes are independent of object key order', () => {
  assert.equal(
    hashTransactionPayload({ a: 1, b: 2 }),
    hashTransactionPayload({ b: 2, a: 1 }),
  );
});

test('Merkle single-leaf root equals the leaf', () => {
  const leaf = hashTransactionPayload('transaction-1');
  assert.equal(computeMerkleRoot([leaf]), leaf);
});

test('Merkle proof verification checks left and right sibling ordering', () => {
  const leaf = hashTransactionPayload('leaf');
  const sibling = hashTransactionPayload('sibling');
  const root = computeMerkleRoot([leaf, sibling]);
  assert.equal(verifyMerkleProof({
    leaf, root, proof: [{ hash: sibling, position: 'right' }],
  }), true);
  assert.equal(verifyMerkleProof({
    leaf, root, proof: [{ hash: sibling, position: 'left' }],
  }), false);
});

test('Merkle proof builder produces verifiable inclusion proofs for every leaf', () => {
  const leaves = ['a', 'b', 'c', 'd', 'e'].map((value) => hashTransactionPayload(value));
  for (let index = 0; index < leaves.length; index += 1) {
    const proof = buildMerkleProof(leaves, index);
    assert.equal(verifyMerkleProof(proof), true);
  }
});

test('Merkle utilities reject malformed inputs', () => {
  assert.throws(() => computeMerkleRoot([]), TypeError);
  assert.throws(() => computeMerkleRoot(['not-a-hash']), TypeError);
  assert.throws(() => buildMerkleProof([], 0), TypeError);
  assert.equal(verifyMerkleProof({ leaf: 'bad', proof: [], root: 'bad' }), false);
});
