import test from 'node:test';
import { equal, rejects } from 'node:assert/strict';

import chanInfoResponse from '../fixtures/chan_info_response.json' with { type: 'json' };
import listChannelsResponse from '../fixtures/list_channels_response.json' with { type: 'json' };
import getNodeInfoResponse from '../fixtures/get_node_info_response.json' with { type: 'json' };
import pendingChannelsResponse from '../fixtures/pending_channels_response.json' with { type: 'json' };
import { getPeerLiquidity } from '../../peers/get_peer_liquidity.js';

const tests = [
  {
    args: {},
    description: 'LND is required',
    error: [400, 'ExpectedLndToGetPeerLiquidity'],
  },
  {
    args: {lnd: {}},
    description: 'A public key is required',
    error: [400, 'ExpectedPublicKeyToGetPeerLiquidity'],
  },
  {
    args: {
      lnd: {
        default: {
          getChanInfo: ({}, cbk) => cbk(null, chanInfoResponse),
          getNodeInfo: ({}, cbk) => cbk(null, getNodeInfoResponse),
          listChannels: ({}, cbk) => cbk(null, listChannelsResponse),
          pendingChannels: ({}, cbk) => cbk(null, pendingChannelsResponse),
        },
      },
      public_key: Buffer.alloc(33).toString('hex'),
    },
    description: 'Get peer liquidity',
    expected: {alias: 'alias', inbound: 1, outbound: 1},
  },
  {
    args: {
      lnd: {
        default: {
          getChanInfo: ({}, cbk) => cbk(null, chanInfoResponse),
          getNodeInfo: ({}, cbk) => cbk('err'),
          listChannels: ({}, cbk) => cbk(null, listChannelsResponse),
          pendingChannels: ({}, cbk) => cbk(null, pendingChannelsResponse),
        },
      },
      public_key: Buffer.alloc(33).toString('hex'),
    },
    description: 'Get peer liquidity when node info returns an error',
    expected: {alias: '', inbound: 1, outbound: 1},
  },
];

for (const { args, description, error, expected } of tests) {
  test(description, async () => {
    if (error) {
      await rejects(getPeerLiquidity(args), error, 'Got expected error');
    } else {
      const peer = await getPeerLiquidity(args);

      equal(peer.alias, expected.alias, 'Alias is returned');
      equal(peer.inbound, expected.inbound, 'Total inbound is returned');
      equal(peer.outbound, expected.outbound, 'Total outbound is returned');
    }
  });
}
