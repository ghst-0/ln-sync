import test from 'node:test';
import { deepEqual, rejects } from 'node:assert/strict';

import { makeLnd } from 'mock-lnd';

import method from './../../nodes/get_node_funds.js';

const tests = [
  {
    args: {},
    description: 'LND is required',
    error: [400, 'ExpectedAuthenticatedLndToGetDetailedBalance'],
  },
  {
    args: {lnd: makeLnd({})},
    description: 'Detailed balance is returned',
    expected: {
      closing_balance: 0,
      conflicted_pending: 0,
      invalid_pending: 0,
      offchain_balance: 2,
      offchain_pending: 0,
      onchain_confirmed: 1,
      onchain_pending: 0,
      onchain_vbytes: 144,
      utxos_count: 1
    },
  },
  {
    args: {
      lnd: makeLnd({
        getChannels: ({}, cbk) => cbk(null, {channels: []}),
        getUtxos: ({}, cbk) => cbk(null, {utxos: []}),
      }),
    },
    description: 'No balance is returned',
    expected: {
      closing_balance: 0,
      conflicted_pending: 0,
      invalid_pending: 0,
      offchain_balance: 0,
      offchain_pending: 0,
      onchain_confirmed: 0,
      onchain_pending: 0,
      onchain_vbytes: 0,
      utxos_count: 0
    },
  },
];

for (const { args, description, error, expected } of tests) {
  test(description, async () => {
    if (error) {
      await rejects(method(args), error, 'Got expected error');
    } else {
      const res = await method(args);

      deepEqual(res, expected, 'Got expected result');
    }
  });
}
