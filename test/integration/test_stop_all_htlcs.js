import test from 'node:test';
import { deepEqual } from 'node:assert/strict';

import asyncAuto from 'async/auto.js';
import asyncMap from 'async/map.js';
import asyncRetry from 'async/retry.js';
import { closeChannel } from 'ln-service';
import { createChainAddress } from 'ln-service';
import { createInvoice } from 'ln-service';
import { deleteForwardingReputations } from 'ln-service';
import { getChannels } from 'ln-service';
import { getHeight } from 'ln-service';
import { openChannel } from 'ln-service';
import { pay } from 'ln-service';
import { sendToChainAddress } from 'ln-service';
import { spawnLightningCluster } from 'ln-docker-daemons';

import { stopAllHtlcs } from './../../index.js';

const capacity = 1e6;
const interval = 100;
const maturity = 100;
const size = 3;
const times = 2000;
const tokens = 10;
const uniq = arr => Array.from(new Set(arr));

test('Stop all HTLCs', async () => {
  const {kill, nodes} = (await spawnLightningCluster({size}));

  const [control, target, remote] = nodes;

  const {generate, lnd} = control;

  await generate({count: maturity});

  await asyncRetry({interval, times}, async () => {
    await generate({});

    const hashes = await asyncMap([lnd, target.lnd, remote.lnd], async n => {
      return (await getHeight({lnd: n})).current_block_hash;
    });

    const [other] = uniq(hashes);

    if (!!other) {
      throw new Error('ExpectedNoOtherHash');
    }
  });

  try {
    // Setup a channel to the target
    await openChannel({
      lnd,
      local_tokens: capacity,
      partner_public_key: target.id,
      partner_socket: target.socket,
    });

    const id = await asyncRetry({interval, times}, async () => {
      const [id] = (await getChannels({lnd})).channels.map(n => n.id);

      await generate({});

      if (!id) {
        throw new Error('ExpectedChannelCreated');
      }

      const {request} = await createInvoice({tokens, lnd: target.lnd});

      await pay({lnd, request});

      return id;
    });

    const {address} = await createChainAddress({lnd: target.lnd});

    await sendToChainAddress({address, lnd, tokens: capacity});

    await asyncRetry({interval, times}, async () => {
      await generate({});

      await openChannel({
        is_private: true,
        lnd: target.lnd,
        local_tokens: capacity / [target, remote].length,
        partner_public_key: remote.id,
        partner_socket: remote.socket,
      });
    });

    await asyncRetry({interval, times}, async () => {
      await generate({});

      const {request} = await createInvoice({
        tokens,
        is_including_private_channels: true,
        lnd: remote.lnd,
      });

      await deleteForwardingReputations({lnd});

      await pay({lnd, request});
    });

    await asyncAuto({
      // Stop the HTLCs
      stop: async () => {
        return await stopAllHtlcs({
          id,
          ids: [id],
          lnd: target.lnd,
          peer: control.id,
        });
      },

      // Attempt an HTLC and get denied
      attempt: async () => {
        const {request} = await createInvoice({
          tokens,
          is_including_private_channels: true,
          lnd: remote.lnd,
        });

        await deleteForwardingReputations({lnd});

        try {
          await pay({lnd, request});

          throw new Error('ExpectedAttemptIsRejected');
        } catch {
          /**/
        }
      },

      // HTLC stopping will halt when the channel closes
      end: ['attempt', async () => {
        return await closeChannel({id, is_force_close: true, lnd: target.lnd});
      }],
    });
  } catch (err) {
    deepEqual(err, null, 'Expected no error');
  }

  await kill({});
});
