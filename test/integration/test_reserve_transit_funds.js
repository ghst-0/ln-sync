import test from 'node:test';
import { ok } from 'node:assert/strict';

import asyncAuto from 'async/auto.js';
import asyncRetry from 'async/retry.js';
import { getChainTransactions } from 'ln-service';
import { spawnLightningCluster } from 'ln-docker-daemons';

import { broadcastTransaction } from './../../chain/index.js';
import { reserveTransitFunds } from './../../funding/index.js';

const interval = 10;
const logger = {info: () => {}, error: () => {}};
const maturity = 100;
const times = 20000;
const tokens = 1e6;

// Reserve transit funds should produce a transit tx and a refund of that tx
test(`Reserve transit funds`, async () => {
  const {kill, nodes} = await spawnLightningCluster({});

  const [{generate, lnd}] = nodes;

  // Make transit funds
  try {
    await generate({count: maturity});

    const transit = await reserveTransitFunds({
      lnd,
      logger,
      tokens,
      ask: (args, cbk) => {
        // Use external funding
        if (args.name === 'internal') {
          return cbk({internal: true});
        }

        // Use standard fee rate
        if (args.name === 'rate') {
          return cbk({rate: args.default});
        }

        throw new Error('UnexpectedQuery');
      },
    });

    await asyncAuto({
      // Broadcast the transaction into a block
      broadcast: async () => {
        return await asyncRetry({interval, times}, async () => {
          // Confirm the transit transaction
          return await broadcastTransaction({
            lnd,
            logger,
            description: 'Transit funding',
            transaction: transit.transaction,
          });
        });
      },

      // Check for confirmation
      confirm: async () => {
        return await asyncRetry({interval, times}, async () => {
          await generate({});

          const {transactions} = await getChainTransactions({lnd});

          const transaction = transactions.find(n => n.id === transit.id);

          if (!transaction.is_confirmed) {
            throw new Error('ExpectedTransitConfirmed');
          }

          ok(transaction.is_confirmed, 'Transaction was confirmed');
        });
      },

      // Get a refund
      refund: ['confirm', async () => {
        return await asyncRetry({interval, times}, async () => {
          await generate({});

          // Confirm the transit transaction
          return await broadcastTransaction({
            lnd,
            logger,
            description: 'Transit refund',
            transaction: transit.refund,
          });
        });
      }],

      // Check for refund confirmation
      returned: ['confirm', async () => {
        return await asyncRetry({interval, times}, async () => {
          await generate({});

          const {transactions} = await getChainTransactions({lnd});

          const transaction = transactions.find(tx => {
            return tx.transaction === transit.refund;
          });

          if (!transaction.is_confirmed) {
            throw new Error('ExpectedRefundTransitConfirmed');
          }

          ok(transaction.is_confirmed, 'Refund transaction was confirmed');
        });
      }],
    });
  } catch (err) {
    equal(err, null, 'Expected no error');
  }

  await kill({});
});
