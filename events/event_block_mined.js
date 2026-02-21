import { syncBlock } from '../sync/index.js';

/** Handle a block mined event

  {
    db: <Database Object>
    emitter: <EventEmitter Object>
    height: <Block Height Number>
    id: <Block Hash Hex String>
  }

  @event 'block_added'
  {
    height: <Height Number>
    id: <Block Hash Hex String>
  }

  @returns via Promise
*/
export default async ({db, emitter, height, id}) => {
  const {created} = await syncBlock({db, height, id});

  if (!created) {
    return;
  }

  return emitter.emit('block_added', {height, id});
};
