import test from 'node:test';
import { deepEqual } from 'node:assert/strict';

import asyncRetry from 'async/retry.js';
import { createChainAddress, getLockedUtxos, getUtxos } from 'ln-service';
import { spawnLightningCluster } from 'ln-docker-daemons';

import { getMaxFundAmount } from './../../index.js';

const feeTokensPerVbyte = 3;
const interval = 10;
const maturityBlocks = 100;
const times = 1000;

const tests = [
  {
    args: ({lnd}) => ({lnd}),
    description: 'Get network name',
    expected: ({}) => ({network: 'btcregtest'}),
  },
];

for (const { description} of tests) {
  test(description, async () => {
    const {nodes} = await spawnLightningCluster({});

    const [{generate, kill, lnd}] = nodes;

    try {
      // Get a funding address
      const {address} = await createChainAddress({lnd, format: 'p2wpkh'});

      // Make some coins
      await generate({address, count: maturityBlocks});

      // Wait for balance to appear
      const utxo = await asyncRetry({interval, times}, async () => {
        const {utxos} = await getUtxos({lnd});

        const [utxo] = utxos;

        if (!utxo) {
          throw new Error('ExpectedUtxoFromGeneration');
        }

        return utxo;
      });

      const maximum = await getMaxFundAmount({
        lnd,
        addresses: [address],
        fee_tokens_per_vbyte: feeTokensPerVbyte,
        inputs: [{
          tokens: utxo.tokens,
          transaction_id: utxo.transaction_id,
          transaction_vout: utxo.transaction_vout,
        }],
      });

      deepEqual(maximum.fee_tokens_per_vbyte, 4.172727272727273, 'Got fee');

      // LND 0.15.4 and previous allowed more funds
      if (maximum.max_tokens === 4999999577) {
        deepEqual(maximum.max_tokens, 4999999577, 'Got max tokens');
      } else {
        deepEqual(maximum.max_tokens, 4999999541, 'Got max tokens');
      }

      deepEqual(
        await getLockedUtxos({lnd}),
        {utxos: []},
        'UTXOs all get unlocked'
      );
    } catch (err) {
      deepEqual(err, null, 'Expected no error');
    }

    await kill({});
  });
}
