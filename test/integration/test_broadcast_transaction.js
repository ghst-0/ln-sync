import test from 'node:test';
import { deepEqual } from 'node:assert/strict';

import asyncAuto from 'async/auto.js';
import asyncRetry from 'async/retry.js';
import { createChainAddress, getChainTransactions, fundPsbt, signPsbt } from 'ln-service';
import { extractTransaction } from 'psbt';
import { spawnLightningCluster } from 'ln-docker-daemons';
import * as tinysecp from 'tiny-secp256k1';
import { broadcastTransaction } from './../../index.js';

const description = 'description';
const interval = 10;
const maturity = 100;
const times = 2000;
const tokens = 1e6;

test('Transaction is broadcast', async () => {
  const [{generate, kill, lnd}] = (await spawnLightningCluster({})).nodes;

  const ecp = (await import('ecpair')).ECPairFactory(tinysecp);

  // Make funds for the node
  await generate({count: maturity});

  try {
    const {address} = await createChainAddress({lnd});

    const {psbt} = await signPsbt({
      lnd,
      psbt: (await fundPsbt({lnd, outputs: [{address, tokens}]})).psbt,
    });

    const {transaction} = extractTransaction({ecp, psbt});

    // Broadcast the transaction into a block while mining
    const {mine} = await asyncAuto({
      // Try publishing the tx
      broadcast: async () => {
        return await asyncRetry({interval, times}, async () => {
          await broadcastTransaction({
            lnd,
            description,
            transaction,
            logger: {info: () => {}},
          });
        });
      },

      // Keep the blockchain going forward
      mine: async () => await asyncRetry({interval, times}, async () => {
        const {transactions} = await getChainTransactions({lnd});

        const tx = transactions.find(n => n.transaction === transaction);

        // The transaction needs to get mined
        await generate({});

        if (!tx || !tx.is_confirmed) {
          throw new Error('ExpectedTransactionConfirmedIntoABlock');
        }

        return tx;
      }),
    });

    deepEqual(mine.description, description, 'Got tx confirmed into block');
    deepEqual(mine.is_confirmed, true, 'Tx is confirmed into a block');
  } catch (err) {
    deepEqual(err, null, 'No error is expected');
  }

  await kill({});
});
