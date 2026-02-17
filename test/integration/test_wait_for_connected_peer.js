import test from 'node:test';
import { deepEqual, rejects } from 'node:assert/strict';

import { addPeer } from 'ln-service';
import asyncRetry from 'async/retry.js';
import { spawnLightningCluster } from 'ln-docker-daemons';
import { waitForConnectedPeer } from './../../index.js';

const size = 2;

test('Peer is connected', async () => {
  const {kill, nodes} = (await spawnLightningCluster({size}));

  const [{lnd}, target] = nodes;

  try {
    await rejects(
      waitForConnectedPeer({lnd, id: target.id, timeout: 10}),
      [504, 'FailedToFindConnectedPeer'],
      'Waiting for peer times out'
    );

    await asyncRetry({}, async () => {
      await addPeer({lnd, public_key: target.id, socket: target.socket});
    });

    await waitForConnectedPeer({lnd, id: target.id});
  } catch (err) {
    deepEqual(err, null, 'No error is expected');
  }

  await kill({});
});
