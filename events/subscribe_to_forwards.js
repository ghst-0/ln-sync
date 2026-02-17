import EventEmitter from 'node:events';
import { subscribeToForwards } from 'lightning';

/** Subscribe to HTLC forwarding events

  {
    lnd: <Authenticated LND API Object>
  }

  @returns
  {
    forwards: <Forwards EventEmitter Object>
  }
*/
export default ({lnd}) => {
  try {
    return {forwards: subscribeToForwards({lnd})};
  } catch (err) {
    // Return a dummy eventEmitter when subscribeToForwards is not supported
    return {forwards: new EventEmitter()};
  }
};
