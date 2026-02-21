import asyncAuto from 'async/auto.js';
import { returnResult } from 'asyncjs-util';

import { getGraphPair } from '../nodes/index.js';

const bigUnits = tokens => tokens ? (tokens / 1e8).toFixed(8) : String();
const short = key => key.slice(0, 16);

/** Describe a channel being added

  {
    db: <Database Object>
    id: <Channel Id String>
  }

  @returns via cbk or Promise
  {
    [description]: {
      action: <Action String>
      detail: <Detail String>
      subject: <Subject String>
    }
  }
*/
export default ({db, id}, cbk) => {
  return new Promise((resolve, reject) => {
    asyncAuto({
      // Check arguments
      validate: cbk => {
        if (!db) {
          return cbk([400, 'ExpectedDbToDescribeChannelAdded']);
        }

        if (!id) {
          return cbk([400, 'ExpectedChannelToDescribeChannelAdded']);
        }

        return cbk();
      },

      // Get the channel pair
      getPair: ['validate', ({}, cbk) => getGraphPair({db, id}, cbk)],

      // Describe the event
      description: ['getPair', ({getPair}, cbk) => {
        // Exit early when there is no known channel
        if (!getPair.pair) {
          return cbk(null, {});
        }

        const channel = `${bigUnits(getPair.channel.capacity)} channel`.trim();
        const [p1, p2] = getPair.pair.nodes.map(n => n.alias || short(n.id));

        return cbk(null, {
          description: {
            action: `added ${channel}`,
            detail: `${id}`,
            subject: `${p1} and ${p2}`,
          },
        });
      }],
    },
    returnResult({reject, resolve, of: 'description'}, cbk));
  });
};
