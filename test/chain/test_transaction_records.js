import test from 'node:test';
import { deepEqual } from 'node:assert/strict';

import { Transaction } from 'bitcoinjs-lib';
import transactionRecords from '../../chain/transaction_records.js';

const tests = [
  {
    args: {
      ended: [],
      id: (new Transaction()).getId(),
      original: (new Transaction()).toHex(),
      pending: [],
      txs: [],
      vout: 0,
    },
    description: 'Transaction records are mapped to contextual records',
    expected: {records: []},
  },
];

for (const { args, description, expected } of tests) {
  test(description, (t, end) => {
    const res = transactionRecords(args);

    deepEqual(res, expected, 'Got expected result');

    return end();
  });
}
