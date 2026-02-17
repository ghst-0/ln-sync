import test from 'node:test';
import { deepEqual, throws } from 'node:assert/strict';

import liquidityTokens from './../../peers/liquidity_tokens.js';

const tests = [
  {
    args: {channels: [], policies: []},
    description: 'No tokens are returned when there are no channels',
    expected: {tokens: []},
  },
  {
    args: {
      channels: [
        {is_active: false},
        {
          is_active: true,
          local_balance: 1,
          partner_public_key: 'b',
          remote_balance: 5,
        },
      ],
      max_fee_rate: 3,
      min_node_score: 1,
      nodes: [{public_key: 'b', score: 10}],
      policies: [
        [{public_key: 'a'}, {fee_rate: 1, public_key: 'b'}],
        [{public_key: 'a'}, {fee_rate: 2, public_key: 'b'}],
        [{public_key: 'a'}, {fee_rate: 10, public_key: 'e'}],
        [{public_key: 'c'}, {public_key: 'd'}],
        [],
      ],
      public_key: 'a',
    },
    description: 'Tokens are returned when there are various policies',
    expected: {tokens: [5]},
  },
  {
    args: {
      channels: [
        {
          is_active: true,
          local_balance: 1,
          partner_public_key: 'b',
          remote_balance: 5,
        },
      ],
      policies: [[{public_key: 'a'}, {fee_rate: 1, public_key: 'b'}]],
      public_key: 'a',
      with: ['b'],
    },
    description: 'With a specific peer and no max fee rate',
    expected: {tokens: [5]},
  },
  {
    args: {
      channels: [
        {
          is_active: true,
          local_balance: 1,
          partner_public_key: 'b',
          remote_balance: 5,
        },
      ],
      is_outbound: true,
      is_top: true,
      policies: [[{public_key: 'a'}, {fee_rate: 1, public_key: 'b'}]],
      public_key: 'a',
    },
    description: 'Outbound tokens are returned',
    expected: {tokens: [1]},
  },
];

for (const { args, description, error, expected } of tests) {
  test(description, (t, end) => {
    if (error) {
      throws(() => liquidityTokens(args), new Error(error), 'Got error');
    } else {
      const tokens = liquidityTokens(args);

      deepEqual(tokens, expected, 'Got expected tokens');
    }

    return end();
  });
}
