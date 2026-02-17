import addressDataFromBech32 from './address_data_from_bech32.js';

/** Determine if a string is bech32 encoded

  {
    input: <Input String>
  }

  @returns
  {
    is_bech32: <String is Bech32 Encoded Bool>
  }
*/
export default ({input}) => {
  try {
    return {is_bech32: !!addressDataFromBech32({address: input})};
  } catch (e) {
    return {is_bech32: false};
  }
};
