import test from 'node:test';
import { deepEqual, throws } from 'node:assert/strict';

import { Transaction } from 'bitcoinjs-lib';

import method from './../../funding/is_encoded_transaction.js';

const tests = [
  {
    args: {input: new Transaction().toHex()},
    description: 'A hex transaction is an encoded tx',
    expected: {is_transaction: true},
  },
  {
    args: {input: 'invalid transaction'},
    description: 'A non-tx string is not a transaction',
    expected: {is_transaction: false},
  },
];

tests.forEach(({args, description, error, expected}) => {
  test(description, (t, end) => {
    if (!!error) {
      throws(() => method(args), new Error(error), 'Error returned');
    } else {
      const got = method(args);

      deepEqual(got, expected, 'Got expected result');
    }

    return end();
  });
});
