import test from 'node:test';
import { deepEqual } from 'node:assert/strict';

import { addPeer, subscribeToOpenRequests } from 'ln-service';
import asyncRetry from 'async/retry.js';
import { spawnLightningCluster } from 'ln-docker-daemons';

import { acceptsChannelOpen } from '../../index.js';

const capacity = 1e6;
const interval = 10;
const maturityBlocks = 100;
const size = 2;
const times = 2000;

test('Check if peer accepts open', async () => {
  const {kill, nodes} = await spawnLightningCluster({size});

  const [{generate, lnd}, target] = nodes;

  try {
    // Make some coins
    await generate({count: maturityBlocks});

    // Connect to the target
    await addPeer({lnd, public_key: target.id, socket: target.socket});

    // Propose a channel to target
    const shouldAccept = await asyncRetry({interval, times}, async () => {
      await acceptsChannelOpen({
        capacity,
        lnd,
        give_tokens: capacity / [lnd, target].length,
        is_private: true,
        partner_public_key: target.id,
      });
    });

    deepEqual(shouldAccept, {is_accepted: true}, 'Node accepts a channel');

    try {
      await acceptsChannelOpen({
        capacity,
        lnd,
        give_tokens: capacity / [lnd, target].length,
        is_private: true,
        is_trusted_funding: true,
        partner_public_key: target.id,
      });
    } catch (error) {
      const [,, {err}] = error;

      deepEqual(err.details, 'requested channel type not supported', 'Fail');
    }

    const sub = subscribeToOpenRequests({lnd: target.lnd});

    // Reject the upcoming channel request on the target
    sub.once('channel_request', request => request.reject({}));

    try {
      await acceptsChannelOpen({
        capacity,
        lnd,
        give_tokens: capacity / [lnd, target].length,
        is_private: true,
        partner_public_key: target.id,
      });
    } catch (err) {
      deepEqual(!!err, true, 'Channel is rejected');
    }
  } catch (err) {
    deepEqual(err, null, 'Expected no error');
  }

  await kill({});
});
