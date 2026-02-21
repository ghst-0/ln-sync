import test from 'node:test';
import { deepEqual, throws } from 'node:assert/strict';

import method from '../../funding/address_data_from_bech32.js';

const tests = [
  {
    args: {address: 'BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4'},
    description: 'Got address data.',
    expected: {data: '751e76e8199196d454941c45d1b3a323f1433bd6', version: 0},
  },
  {
    args: {address: 'abcdef1l7aum6echk45nj3s0wdvt2fg8x9yrzpqzd3ryx'},
    description: 'Got bech32m address data.',
    expected: {data: 'f779bd6717b56939460f7358b5250731483104', version: 31},
  },
];

for (const { args, description, error, expected } of tests) {
  test(description, (t, end) => {
    if (error) {
      throws(() => method(args), new Error(error), 'Error returned');

      return end();
    }
    const got = method(args);

    got.data = got.data.toString('hex');

    deepEqual(got, expected, 'Got expected result');

    return end();
  });
}
