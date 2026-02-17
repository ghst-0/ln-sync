import test from 'node:test';
import { deepEqual } from 'node:assert/strict';

import asyncRetry from 'async/retry.js';
import { closeChannel } from 'ln-service';
import { openChannel } from 'ln-service';
import { spawnLightningCluster } from 'ln-docker-daemons';

import { subscribeToPendingChannels } from './../../index.js';

const capacity = 1e6;
const count = 100;
const delay = 100;
const interval = 10;
const size = 2;
const times = 1000;

test('Subscribe to pending chans', async () => {
  const {kill, nodes} = (await spawnLightningCluster({size}));

  const [{generate, lnd}, target] = nodes;

  try {
    const sub = subscribeToPendingChannels({delay, lnd});

    const closing = [];
    const opening = [];

    sub.on('closing', n => closing.push(n))
    sub.on('opening', n => opening.push(n));

    await generate({count});

    const channel = await asyncRetry({interval, times}, async () => {
      return await openChannel({
        lnd,
        local_tokens: capacity,
        partner_public_key: target.id,
        partner_socket: target.socket,
      });
    });

    await asyncRetry({interval, times}, async () => {
      if (!opening.length) {
        throw new Error('ExpectedChannelOpening');
      }
    });

    await closeChannel({
      lnd,
      is_force_close: true,
      transaction_id: channel.transaction_id,
      transaction_vout: channel.transaction_vout,
    });

    await asyncRetry({interval, times}, async () => {
      if (!closing.length) {
        throw new Error('ExpectedChannelClosing');
      }
    });
  } catch (err) {
    deepEqual(err, null, 'Expected no error');
  }

  await kill({});
});
