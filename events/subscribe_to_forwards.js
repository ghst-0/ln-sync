import EventEmitter from 'node:events';
import { subscribeToForwards as ln_subscribeToForwards } from 'lightning';

/** Subscribe to HTLC forwarding events

  {
    lnd: <Authenticated LND API Object>
  }

  @returns
  {
    forwards: <Forwards EventEmitter Object>
  }
*/
const subscribeToForwards = ({lnd}) => {
  try {
    return {forwards: ln_subscribeToForwards({lnd})};
  } catch {
    // Return a dummy eventEmitter when subscribeToForwards is not supported
    return {forwards: new EventEmitter()};
  }
};

export { subscribeToForwards }
