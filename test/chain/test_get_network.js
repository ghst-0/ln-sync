import test from 'node:test';
import { rejects, equal } from 'node:assert/strict';

import { getInfoResponse } from './../fixtures/index.js';
import { getNetwork } from './../../index.js';

const getInfoRes = () => JSON.parse(JSON.stringify(getInfoResponse));

const tests = [
  {
    args: {},
    description: 'Getting network requires lnd',
    error: [400, 'ExpectedLndToGetNetworkForLnd'],
  },
  {
    args: {
      lnd: {
        default: {
          getInfo: ({}, cbk) => {
            const res = getInfoRes();

            res.chains.push({chain: 'litecoin', network: 'mainnet'});

            return cbk(null, res);
          },
        },
      },
    },
    description: 'Expects only a single chain',
    error: [400, 'CannotDetermineChainFromNode'],
  },
  {
    args: {
      lnd: {
        default: {
          getInfo: ({}, cbk) => {
            const res = getInfoRes();

            res.chains = [{chain: 'chain', network: 'network'}];

            return cbk(null, res);
          },
        },
      },
    },
    description: 'Expects a known chain',
    error: [400, 'ExpectedLndWithKnownChain'],
  },
  {
    args: {lnd: {default: {getInfo: ({}, cbk) => cbk(null, getInfoRes())}}},
    description: 'Network is returned from getInfo response',
    expected: {network: 'btc'},
  },
];

tests.forEach(({args, description, error, expected}) => {
  test(description, async () => {
    if (!!error) {
      await rejects(getNetwork(args), error, 'Got expected error');
    } else {
      const {network} = await getNetwork(args);

      equal(network, expected.network, 'Got expected network');
    }
  });
});
