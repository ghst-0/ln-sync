import * as colorette from 'colorette';

import styling from './log_line_styling.json' with { type: 'json' };

/** Styled subject for an event log line

  {
    event: <Event Name String>
    is_local: <Event is Local Bool>
    is_major: <Event is Major Bool>
    subject: <Subject String>
  }

  @returns
  <Subject String>
*/
export default args => {
  if (args.is_local && args.is_major) {
    return colorette.bold(colorette[styling.colors[args.event]](args.subject));
  }

  if (args.is_local) {
    return colorette[styling.colors[args.event]](args.subject);
  }

  return args.subject;
};
