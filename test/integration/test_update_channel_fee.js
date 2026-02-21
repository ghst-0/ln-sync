import test from 'node:test';
import { deepEqual } from 'node:assert/strict';

import asyncRetry from 'async/retry.js';
import { getChannel, getChannels, openChannel } from 'ln-service';
import { spawnLightningCluster } from 'ln-docker-daemons';

import { updateChannelFee } from '../../index.js';

const capacity = 1e6;
const interval = 10;
const maturityBlocks = 100;
const size = 2;
const times = 2000;

test('Update a channel fee', async () => {
  const {kill, nodes} = await spawnLightningCluster({size});

  const [{generate, lnd}, target] = nodes;

  const expected = {
    base_fee_mtokens: '2000',
    cltv_delta: 144,
    fee_rate: 1000,
    inbound_base_discount_mtokens: '0',
    inbound_rate_discount: 0,
    is_disabled: false,
    max_htlc_mtokens: '1000000',
    min_htlc_mtokens: '10000',
    public_key: target.id,
  };

  try {
    // Make some coins
    await generate({count: maturityBlocks});
    await target.generate({count: maturityBlocks});

    // Make a channel with the target
    const channelOpen = await openChannel({
      lnd,
      local_tokens: capacity,
      partner_public_key: target.id,
      partner_socket: target.socket,
    });

    // Update the channel with a new routing fee
    await asyncRetry({interval, times}, async () => {
      // The channel has to be confirmed
      await generate({});
      await target.generate({});

      // Set the channel fees
      await updateChannelFee({
        base_fee_mtokens: expected.base_fee_mtokens,
        cltv_delta: expected.cltv_delta,
        fee_rate: expected.fee_rate,
        from: target.id,
        lnd: target.lnd,
        max_htlc_mtokens: expected.max_htlc_mtokens,
        min_htlc_mtokens: expected.min_htlc_mtokens,
        transaction_id: channelOpen.transaction_id,
        transaction_vout: channelOpen.transaction_vout,
      });
    });

    const [channel] = (await getChannels({lnd: target.lnd})).channels;

    const {policies} = await getChannel({lnd: target.lnd, id: channel.id});

    const policy = policies.find(n => n.public_key === target.id);

    expected.updated_at = policy.updated_at;

    deepEqual(policy, expected, 'Got expected policy updates');
  } catch (err) {
    deepEqual(err, null, 'Expected no error');
  }

  // Always clean up the test instances
  await kill({});
});
