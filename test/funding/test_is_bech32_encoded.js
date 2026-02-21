import test from 'node:test';
import { deepEqual, throws } from 'node:assert/strict';

import method from '../../funding/is_bech32_encoded.js';

const tests = [
  {
    args: {
      input: 'tb1qzmswhxxwxvhat6ke3wu27gqqxn4qxqn6qwarwkz6lmky3l3jqjfqy5wl9x',
    },
    description: 'A bech32 address is bech32 encoded',
    expected: {is_bech32: true},
  },
  {
    args: {input: 'invalid bech32 input'},
    description: 'Non bech32 content is not bech32 encoded',
    expected: {is_bech32: false},
  },
];

for (const { args, description, error, expected } of tests) {
  test(description, (t, end) => {
    if (error) {
      throws(() => method(args), new Error(error), 'Error returned');
    } else {
      const got = method(args);

      deepEqual(got, expected, 'Got expected result');
    }

    return end();
  });
}
