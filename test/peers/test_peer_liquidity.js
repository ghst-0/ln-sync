import test from 'node:test';
import { deepEqual, throws } from 'node:assert/strict';

import peerLiquidity from '../../peers/peer_liquidity.js';

const tests = [
  {
    args: {
      channels: [{
        local_balance: 1,
        pending_payments: [
          {
            id: 'id',
            is_outgoing: true,
            tokens: 1,
          },
          {
            id: 'id',
            is_outgoing: false,
            tokens: 1,
          },
          {
            id: 'id3',
            is_outgoing: true,
            tokens: 1,
          },
          {
            id: 'id2',
            is_outgoing: false,
            tokens: 2,
          },
        ],
        remote_balance: 1,
      }],
      opening: [{
        local_balance: 1,
        remote_balance: 1,
      }],
      settled: 'id',
    },
    description: 'Channels are mapped to liquidity balances',
    expected: {
      liquidity: {
        inbound: 2,
        inbound_opening: 1,
        inbound_pending: 1,
        outbound: 2,
        outbound_opening: 1,
        outbound_pending: 2,
      },
    },
  },
];

for (const { args, description, error, expected } of tests) {
  test(description, (t, end) => {
    if (error) {
      throws(() => peerLiquidity(args), new Error(error));
    } else {
      const liquidity = peerLiquidity(args);

      deepEqual(liquidity, expected.liquidity, 'Got expected liquidity');
    }

    return end();
  });
}
