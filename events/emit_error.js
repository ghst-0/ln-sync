const {isArray} = Array;

/** Emit an error

  {
    emitter: <Event Emitter Object>
    err: <Error To Emit Object>
  }
*/
const emitError = ({emitter, err}) => {
  if (!emitter.listenerCount('error')) {
    return;
  }

  if (!isArray(err)) {
    return emitter.emit('error', [503, 'UnexpectedErrFromSyncEvents', {err}]);
  }

  emitter.emit('error', err);
};

export { emitError }
