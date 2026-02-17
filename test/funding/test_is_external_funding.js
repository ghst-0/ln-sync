import test from 'node:test';
import { deepEqual, rejects } from 'node:assert/strict';

import { makeWalletVersionResponse } from 'mock-lnd';
import { makeLnd } from 'mock-lnd';
import method from './../../funding/is_external_funding.js';

const makeArgs = overrides => {
  const args = {
    ask: ({}, cbk) => cbk({internal: false}),
    lnd: makeLnd({}),
    outputs: [],
  };

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const tests = [
  {
    args: makeArgs({ask: undefined}),
    description: 'An ask function is required',
    error: [400, 'ExpectedAskFunctionToDetermineExternalFunding'],
  },
  {
    args: makeArgs({lnd: undefined}),
    description: 'LND is required',
    error: [400, 'ExpectedLndToDetermineExternalFunding'],
  },
  {
    args: makeArgs({outputs: undefined}),
    description: 'Outputs are required',
    error: [400, 'ExpectedTxOutputsToDetermineExternalFunding'],
  },
  {
    args: makeArgs({}),
    description: 'External funding is confirmed.',
    expected: {is_external: true},
  },
  {
    args: makeArgs({
      ask: ({}, cbk) => cbk({internal: false}),
      lnd: makeLnd({
        getWalletVersion: ({}, cbk) => {
          return cbk(null, makeWalletVersionResponse({
            hash: '3ae46d81f4a2edad06ef778b2940d9b06386d93b',
          }));
        },
      }),
    }),
    description: 'External funding is automatic on older versions.',
    expected: {is_external: true},
  },
];

tests.forEach(({args, description, error, expected}) => {
  test(description, async () => {
    if (!!error) {
      await rejects(method(args), error, 'Got expected error');
    } else {
      const got = await method(args);

      deepEqual(got, expected, 'Got expected result');
    }
  });
});
