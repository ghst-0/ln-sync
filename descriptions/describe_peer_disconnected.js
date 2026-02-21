import asyncAuto from 'async/auto.js';
import { returnResult } from 'asyncjs-util';

import { getGraphNode } from '../nodes/index.js';

const shortKey = key => key.slice(0, 16);

/** Describe a peer being disconnected

  {
    db: <Database Object>
    from: <Peer Public Key Hex String>
    node: <Node Public Key Hex String>>
  }

  @returns via cbk or Promise
  {
    [description]: {
      action: <Action String>
      detail: <Detail String>
      is_local: <Is Local Bool>
      subject: <Subject String>
    }
  }
*/
export default ({db, from, node}, cbk) => {
  return new Promise((resolve, reject) => {
    asyncAuto({
      // Check arguments
      validate: cbk => {
        if (!db) {
          return cbk([400, 'ExpectedDbToDescribePeerDisconnected']);
        }

        if (!from) {
          return cbk([400, 'ExpectedPeerToDescribePeerDisconnected']);
        }

        if (!node) {
          return cbk([400, 'ExpectedNodeToDescribePeerDisconnected']);
        }

        return cbk();
      },

      // Get node details
      getNode: ['validate', ({}, cbk) => getGraphNode({db, id: node}, cbk)],

      // Get peer details
      getPeer: ['validate', ({}, cbk) => getGraphNode({db, id: from}, cbk)],

      // Describe the event
      description: ['getNode', 'getPeer', ({getNode, getPeer}, cbk) => {
        return cbk(null, {
          description: {
            action: `disconnected from ${getPeer.alias}`.trim(),
            detail: `${getPeer.id}`,
            is_local: true,
            subject: `${getNode.alias || shortKey(getNode.id)}`,
          },
        });
      }],
    },
    returnResult({reject, resolve, of: 'description'}, cbk));
  });
};
