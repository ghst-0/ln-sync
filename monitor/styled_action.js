import * as colorette from 'colorette';

import styling from './log_line_styling.json' with { type: 'json' };

/** Styled action for an event log line

  {
    action: <Action String>
    event: <Event Name String>
    is_local: <Event is Local Bool>
    is_major: <Event is Major Bool>
  }

  @returns
  <Action String>
*/
export default args => {
  if (!!args.is_local && !!args.is_major) {
    return colorette.bold(colorette[styling.colors[args.event]](args.action));
  }

  if (!!args.is_local) {
    return colorette[styling.colors[args.event]](args.action);
  }

  return colorette[styling.colors[args.event]](args.action);
};
