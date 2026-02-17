import test from 'node:test';
import { deepEqual, rejects } from 'node:assert/strict';

import asyncRetry from 'async/retry.js';
import { createChainAddress } from 'ln-service';
import { getUtxos } from 'ln-service';
import { sendToChainAddress } from 'ln-service';
import { spawnLightningCluster } from 'ln-docker-daemons';

import { fundPsbtDisallowingInputs } from './../../index.js';

const format = 'np2wpkh';
const interval = 10;
const maturityBlocks = 100;
const size = 2;
const times = 2000;
const tokens = 1e6;

test('Fund disallowing inputs', async () => {
  const {kill, nodes} = await spawnLightningCluster({size});

  const [{generate, lnd}, target] = nodes;

  try {
    // Make some coins
    await generate({count: maturityBlocks});

    const {address} = await createChainAddress({format, lnd: target.lnd});

    await sendToChainAddress({address, lnd, tokens});

    await asyncRetry({interval, times}, async () => {
      await generate({});

      await sendToChainAddress({
        lnd,
        tokens,
        address: (await createChainAddress({lnd: target.lnd})).address,
      });
    });

    const utxos = await asyncRetry({interval, times}, async () => {
      await generate({});

      const {utxos} = await getUtxos({lnd: target.lnd});

      if (!utxos.length || !!utxos.find(n => !n.confirmation_count)) {
        throw new Error('ExpectedConfirmedUtxos');
      }

      return utxos;
    });

    const fundWhileAvoiding = fundPsbtDisallowingInputs({
      disallow_inputs: utxos.filter(n => n.address_format === format),
      lnd: target.lnd,
      outputs: [{address, tokens: tokens + (tokens / 2)}],
    });

    await rejects(
      fundWhileAvoiding,
      [503, 'UnexpectedErrorFundingTransaction'],
      'Insufficient funding'
    );

    const funds = await fundPsbtDisallowingInputs({
      disallow_inputs: utxos.filter(n => n.address_format === format),
      lnd: target.lnd,
      outputs: [{address, tokens: (tokens / 2)}],
    });

    deepEqual(funds.outputs.length , 2, 'Got expected outputs');
  } catch (err) {
    deepEqual(err, null, 'Expected no error');
  }

  await kill({});
});
