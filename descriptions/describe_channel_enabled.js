import asyncAuto from 'async/auto.js';
import { returnResult } from 'asyncjs-util';

import { getGraphPair } from '../nodes/index.js';

const bigUnits = tokens => tokens ? (tokens / 1e8).toFixed(8) : String();
const short = key => key.slice(0, 16);

/** Describe a channel being enabled

  {
    db: <Database Object>
    id: <Channel Id String>
    public_key: <Public Key Hex String>
  }

  @returns via cbk or Promise
  {
    [description]: {
      action: <Action String>
      detail: <Detail String>
      is_local: <Is Local Bool>
      is_major: <Is Major Bool>
      subject: <Subject String>
    }
  }
*/
export default (args, cbk) => {
  return new Promise((resolve, reject) => {
    asyncAuto({
      // Check arguments
      validate: cbk => {
        if (!args.db) {
          return cbk([400, 'ExpectedDbToDescribeChannelEnabled']);
        }

        if (!args.id) {
          return cbk([400, 'ExpectedChannelToDescribeChannelEnabled']);
        }

        if (!args.public_key) {
          return cbk([400, 'ExpectedNodePublicKeyToDescribeChannelEnabled']);
        }

        return cbk();
      },

      // Get the channel pair
      getPair: ['validate', ({}, cbk) => {
        return getGraphPair({db: args.db, id: args.id}, cbk);
      }],

      // Describe the event
      description: ['getPair', ({getPair}, cbk) => {
        // Exit early when there is no known channel
        if (!getPair.pair) {
          return cbk(null, {});
        }

        const channel = `${bigUnits(getPair.channel.capacity)} channel`.trim();
        const peer = getPair.pair.nodes.find(n => n.id !== args.public_key);
        const subject = getPair.pair.nodes.find(n => n.id === args.public_key);

        return cbk(null, {
          description: {
            action: `reactivated ${channel}`,
            detail: `with ${peer.alias || short(peer.id)}`,
            is_local: true,
            is_major: true,
            subject: subject.alias || short(subject.id),
          },
        });
      }],
    },
    returnResult({reject, resolve, of: 'description'}, cbk));
  });
};
