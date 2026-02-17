import { script } from 'bitcoinjs-lib';

import addressDataFromBech32 from './address_data_from_bech32.js';

const bufferAsHex = buffer => buffer.toString('hex');
const {compile} = script;
const encodeVersion = version => 80 + version;

/** Map a bech32 address to an output script

  {
    address: <Bech32 Address String>
  }

  @returns
  {
    script: <Output Script Hex String>
  }
*/
export default ({address}) => {
  const decoded = addressDataFromBech32({address});

  // Encode the version as a script number
  const version = decoded.version ? encodeVersion(decoded.version) : Number();

  // Bech32 addresses are a version number plus a data push
  return {script: bufferAsHex(compile([version, decoded.data]))};
};
