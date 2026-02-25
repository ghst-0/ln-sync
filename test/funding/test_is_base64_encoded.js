import test from 'node:test';
import { deepEqual, throws } from 'node:assert/strict';

import { isBase64Encoded } from '../../funding/is_base64_encoded.js';

const tests = [
  {
    args: {input: Buffer.alloc(10).toString('base64')},
    description: 'A buffer encoded as base64 is base64 encoded',
    expected: {is_base64: true},
  },
  {
    args: {input: 'invalid base64 input'},
    description: 'A buffer encoded as hex is not base64 encoded',
    expected: {is_base64: false},
  },
  {
    args: {},
    description: 'Nothing is not base64',
    expected: {is_base64: false},
  },
];

for (const { args, description, error, expected } of tests) {
  test(description, (t, end) => {
    if (error) {
      throws(() => isBase64Encoded(args), new Error(error), 'Error returned');
    } else {
      const got = isBase64Encoded(args);

      deepEqual(got, expected, 'Got expected result');
    }

    return end();
  });
}
