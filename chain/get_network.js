import asyncAuto from 'async/auto.js';
import { getWalletInfo } from 'lightning';
import { returnResult } from 'asyncjs-util';

import networks from './networks.json' with { type: 'json' };

const bjNames = {btc: 'bitcoin', btcregtest: 'regtest', btcsignet: 'signet', btctestnet: 'testnet', btctestnet4: 'testnet4'};
const {keys} = Object;
const reversedBytes = hex => Buffer.from(hex, 'hex').reverse().toString('hex');

/** Get network name for lnd

  {
    lnd: <Authenticated LND API Object>
  }

  @returns via cbk or Promise
  {
    [bitcoinjs]: <Bitcoin JS Network Name String>
    network: <Network Name String>
  }
*/
export default ({lnd}, cbk) => {
  return new Promise((resolve, reject) => {
    asyncAuto({
      // Check arguments
      validate: cbk => {
        if (!lnd) {
          return cbk([400, 'ExpectedLndToGetNetworkForLnd']);
        }

        return cbk();
      },

      // Get wallet info
      getInfo: ['validate', ({}, cbk) => getWalletInfo({lnd}, cbk)],

      // Network for swap
      network: ['getInfo', ({getInfo}, cbk) => {
        const [chain, otherChain] = getInfo.chains;

        if (otherChain) {
          return cbk([400, 'CannotDetermineChainFromNode']);
        }

        const network = keys(networks.chains).find(network => {
          return chain === reversedBytes(networks.chains[network]);
        });

        if (!network) {
          return cbk([400, 'ExpectedLndWithKnownChain']);
        }

        return cbk(null, {network, bitcoinjs: bjNames[network]});
      }],
    },
    returnResult({reject, resolve, of: 'network'}, cbk));
  });
};
