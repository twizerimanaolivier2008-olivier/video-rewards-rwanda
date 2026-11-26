import { createHash } from 'node:crypto';

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableValue(value[key]);
      return result;
    }, {});
  }
  return value;
};

export const hashTransactionPayload = (payload) => {
  const canonical = typeof payload === 'string' ? payload : JSON.stringify(stableValue(payload));
  if (typeof canonical !== 'string' || canonical.length === 0) {
    throw new TypeError('Transaction payload must not be empty or unserializable.');
  }
  return sha256(canonical);
};

export const computeMerkleRoot = (leaves) => {
  if (!Array.isArray(leaves) || leaves.length === 0) {
    throw new TypeError('At least one Merkle leaf is required.');
  }
  let level = leaves.map((leaf) => {
    const value = String(leaf).toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(value)) throw new TypeError('Merkle leaves must be SHA-256 hashes.');
    return value;
  });

  while (level.length > 1) {
    const next = [];
    for (let index = 0; index < level.length; index += 2) {
      const left = Buffer.from(level[index], 'hex');
      const right = Buffer.from(level[index + 1] || level[index], 'hex');
      next.push(sha256(Buffer.concat([left, right])));
    }
    level = next;
  }
  return level[0];
};

export const buildMerkleProof = (leaves, leafIndex) => {
  if (!Array.isArray(leaves) || leaves.length === 0 ||
      !Number.isInteger(leafIndex) || leafIndex < 0 || leafIndex >= leaves.length) {
    throw new TypeError('A valid leaf list and index are required.');
  }
  let level = leaves.map((leaf) => {
    const value = String(leaf).toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(value)) throw new TypeError('Merkle leaves must be SHA-256 hashes.');
    return value;
  });
  let index = leafIndex;
  const proof = [];

  while (level.length > 1) {
    const siblingIndex = index % 2 === 0
      ? Math.min(index + 1, level.length - 1)
      : index - 1;
    proof.push({
      hash: level[siblingIndex],
      position: siblingIndex < index ? 'left' : 'right',
    });

    const next = [];
    for (let cursor = 0; cursor < level.length; cursor += 2) {
      const left = Buffer.from(level[cursor], 'hex');
      const right = Buffer.from(level[cursor + 1] || level[cursor], 'hex');
      next.push(sha256(Buffer.concat([left, right])));
    }
    level = next;
    index = Math.floor(index / 2);
  }

  return { leaf: String(leaves[leafIndex]).toLowerCase(), proof, root: level[0] };
};

export const verifyMerkleProof = ({ leaf, proof, root }) => {
  if (!Array.isArray(proof) || !/^[a-f0-9]{64}$/i.test(String(leaf)) ||
      !/^[a-f0-9]{64}$/i.test(String(root))) return false;
  let current = String(leaf).toLowerCase();
  for (const step of proof) {
    if (!step || !/^[a-f0-9]{64}$/i.test(String(step.hash)) ||
        !['left', 'right'].includes(step.position)) return false;
    const sibling = Buffer.from(String(step.hash), 'hex');
    const node = Buffer.from(current, 'hex');
    current = step.position === 'left'
      ? sha256(Buffer.concat([sibling, node]))
      : sha256(Buffer.concat([node, sibling]));
  }
  return current === String(root).toLowerCase();
};
