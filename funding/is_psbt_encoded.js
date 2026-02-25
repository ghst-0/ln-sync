import { decodePsbt } from 'psbt';

/** Determine if a string is PSBT encoded

  {
    ecp: <ECPair Object>
    input: <PSBT Input String>
  }

  @returns
  {
    is_psbt: <String is PSBT Encoded Bool>
  }
*/
const isPsbtEncoded = ({ecp, input}) => {
  try {
    return {is_psbt: !!decodePsbt({ecp, psbt: input})};
  } catch {
    return {is_psbt: false};
  }
};

export { isPsbtEncoded }
