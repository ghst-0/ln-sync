import asyncAuto from 'async/auto.js';
import { returnResult } from 'asyncjs-util';

import { getGraphNode, getGraphPair } from './../graph/index.js';

const mtokensAsBig = mtokens => (Number(mtokens) / 1e11).toFixed(11);
const shortKey = key => key.substring(0, 16);

/** Describe a payment attempt failing

  {
    db: <Database Object>
    mtokens: <Sending Millitokens String>
    out_channel: <Sending Out Channel Id String>
    public_key: <Sending Node Public Key Hex String>
  }

  @returns via cbk or Promise
  {
    [description]: {
      action: <Action String>
      detail: <Detail String>
      is_local: <Describes Node Local Event Bool>
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
          return cbk([400, 'ExpectedDbToDescribeAttemptPaymentFail']);
        }

        if (!args.mtokens) {
          return cbk([400, 'ExpectedMtokensToDescribeAttemptPaymentFail']);
        }

        if (!args.out_channel) {
          return cbk([400, 'ExpectedOutChannelToDescribeAttemptPaymentFail']);
        }

        if (!args.public_key) {
          return cbk([400, 'ExpectedPublicKeyToDescribeAttemptPaymentFail']);
        }

        return cbk();
      },

      // Get the out channel pair
      getPair: ['validate', ({}, cbk) => {
        return getGraphPair({db: args.db, id: args.out_channel}, cbk);
      }],

      // Get the sending node details
      onNode: ['validate', ({}, cbk) => {
        return getGraphNode({db: args.db, id: args.public_key}, cbk);
      }],

      // Describe the event
      description: ['getPair', 'onNode', ({getPair, onNode}, cbk) => {
        // Exit early when there is no known outgoing channel
        if (!getPair.pair) {
          return cbk(null, {});
        }

        const out = getPair.pair.nodes.find(n => n.id !== onNode.id);

        const on = `on ${out.alias || shortKey(out.id)} ${args.out_channel}`;

        return cbk(null, {
          description: {
            action: 'outbound htlc canceled',
            detail: `${mtokensAsBig(args.mtokens)} ${on}`,
            is_local: true,
            subject: onNode.alias || shortKey(onNode.id),
          },
        });
      }],
    },
    returnResult({reject, resolve, of: 'description'}, cbk));
  });
};
