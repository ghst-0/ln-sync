import test from 'node:test';
import { deepEqual, fail } from 'node:assert/strict';

import { spawnLightningCluster } from 'ln-docker-daemons';

import { getNetwork } from './../../index.js';

const tests = [
  {
    args: ({lnd}) => ({lnd}),
    description: 'Get network name',
    expected: ({}) => ({bitcoinjs: 'regtest', network: 'btcregtest'}),
  },
];

for (const { args, description, expected } of tests) {
  test(description, async () => {
    const [{id, kill, lnd}] = (await spawnLightningCluster({})).nodes;

    try {
      const res = await getNetwork(args({id, lnd}));

      deepEqual(res, expected({id}), 'Got expected result');
    } catch (err) {
      fail(err);
    }

    await kill({});
  });
}
