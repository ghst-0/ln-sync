import test from 'node:test';
import { deepEqual } from 'node:assert/strict';

import asyncRetry from 'async/retry.js';
import {
  broadcastChainTransaction,
  createChainAddress,
  getChainTransactions,
  getPublicKey,
  sendToChainAddress
} from 'ln-service';
import { networks, payments, Transaction } from 'bitcoinjs-lib';
import { spawnLightningCluster } from 'ln-docker-daemons';

import { getNetwork } from '../../chain/index.js';
import { getTransitRefund } from '../../funding/index.js';

const {fromHex} = Transaction;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const maturityBlocks = 100;
const {p2wpkh} = payments;
const tokens = 1e6;
const transitKeyFamily = 805;

test('Get a refund transaction', async () => {
  const {kill, nodes} = await spawnLightningCluster({});

  const [{generate, lnd}] = nodes;

  try {
    // Make some coins
    await generate({count: maturityBlocks});

    // Derive a transit key
    const transitKey = await getPublicKey({lnd, family: transitKeyFamily});

    // Put together the transit address
    const {address} = p2wpkh({
      pubkey: hexAsBuffer(transitKey.public_key),
      network: networks[(await getNetwork({lnd})).bitcoinjs],
    });

    // Move coins to the transit address
    const {id} = await sendToChainAddress({address, lnd, tokens});

    // The send should be in the tx list
    const {transactions} = await getChainTransactions({lnd});

    // It will be the unconfirmed one
    const {transaction} = transactions.find(n => !n.is_confirmed);

    // The spending output index will match the send value
    const index = fromHex(transaction).outs.findIndex(n => n.value === tokens);

    // Make the refund of the transit funds into the refund address
    const {refund} = await getTransitRefund({
      lnd,
      funded_tokens: tokens,
      network: (await getNetwork({lnd})).network,
      refund_address: (await createChainAddress({lnd})).address,
      transit_address: address,
      transit_key_index: transitKey.index,
      transit_public_key: transitKey.public_key,
      transaction_id: id,
      transaction_vout: index,
    });

    // Mine the refund into a block
    await asyncRetry({times: maturityBlocks}, async () => {
      await broadcastChainTransaction({lnd, transaction: refund});

      const got = (await getChainTransactions({lnd})).transactions.find(tx => {
        return tx.id === fromHex(refund).getId();
      });

      if (got.is_confirmed) {
        return;
      }

      await generate({});

      throw new Error('ExpectedRefundTransactionConfirmed');
    });
  } catch (err) {
    deepEqual(err, null, 'Expected no error');
  }

  await kill({});
});
