import styling from './log_line_styling.json' with { type: 'json' };
import styledAction from './styled_action.js';
import styledSubject from './styled_subject.js';

/** Get a log line for a change event

  {
    [description]: {
      action: <Action String>
      detail: <Detail String>
      is_local: <Event Is Local Bool>
      is_major: <Event Is Major Bool>
      subject: <Subject String>
    }
    event: <Event Name String>
    mode: <Logging Mode String>
  }

  @returns
  {
    [line]: <Log Line String>
  }
*/
export default ({description, event, mode}) => {
  if (!description) {
    return {};
  }

  if (mode === 'local' && !description.is_local) {
    return {};
  }

  const emoji = styling.emojis[event];
  const date = new Date().toISOString();
  const detail = description.detail || String();

  const action = styledAction({
    event,
    action: description.action,
    is_local: description.is_local,
    is_major: description.is_major,
  });

  const subject = styledSubject({
    event,
    is_local: description.is_local,
    is_major: description.is_major,
    subject: description.subject,
  });

  return {line: `${date} ${emoji} ${subject} ${action} ${detail}`.trim()};
};
