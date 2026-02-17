import EventEmitter from 'node:events';
import asyncDoUntil from 'async/doUntil.js';
import { subscribeToChannels, subscribeToGraph } from 'lightning';

import emitError from './emit_error.js';
import subscribeToForwards from './subscribe_to_forwards.js';
import syncFromDataEvents from './sync_from_data_events.js';

const subRestartDelayMs = 1000 * 5;

/** Subscribe to changes

  {
    db: <Database Object>
    lnd: <Authenticated LND API Object>
  }

  @throws
  <Error>

  @returns
  <EventEmitter Object>

  @event 'block'
  {
    height: <Block Height Number>
    id: <Block Hash Hex String>
  }
*/
export default ({db, lnd}) => {
  if (!db) {
    throw new Error('ExpectedDatabaseToSubscribeToChanges');
  }

  if (!lnd) {
    throw new Error('ExpectedLndToSubscribeToChanges');
  }

  const emitter = new EventEmitter();

  asyncDoUntil(
    cbk => {
      const channels = subscribeToChannels({lnd});
      const {forwards} = subscribeToForwards({lnd});
      const graph = subscribeToGraph({lnd});

      const subs = [channels, forwards, graph];

      for (const sub of subs) {
        sub.on('error', () => {
          // Eliminate other listeners to prevent duplicate events
          for (const n of subs) {
            n.removeAllListeners()
          }

          // Restart the subscription
          return setTimeout(cbk, subRestartDelayMs);
        });
      }

      syncFromDataEvents({
        channels,
        db,
        emitter,
        forwards,
        graph,
        lnd,
      },
      err => {
        if (err) {
          emitError({emitter, err: [503, 'UnexpectedSyncError', {err}]});
        }

        // Restart the subscription
        return setTimeout(() => cbk(), subRestartDelayMs);
      });
    },
    cbk => cbk(null, !emitter.listenerCount('error')),
    err => {
      if (err) {
        return emitError({emitter, err: [503, 'UnexpectedChangesErr', {err}]});
      }
    }
  );

  return emitter;
};
