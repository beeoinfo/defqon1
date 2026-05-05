import { createHash } from 'node:crypto';

function sortObject(value) {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((sorted, key) => {
        sorted[key] = sortObject(value[key]);
        return sorted;
      }, {});
  }

  return value;
}

export function stableJsonStringify(value) {
  return JSON.stringify(sortObject(value));
}

export function createSha256Hash(value) {
  return createHash('sha256').update(stableJsonStringify(value)).digest('hex');
}
