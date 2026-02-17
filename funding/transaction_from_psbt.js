import { extractTransaction, finalizePsbt } from 'psbt';

/** Extract a transaction from a PSBT if it can be extracted

  {
    ecp: <ECPair Object>
    psbt: <PSBT Hex String>
  }

  @returns
  {
    transaction: <Raw Trarnsaction Hex String>
  }
*/
export default ({ecp, psbt}) => {
  // Attempt extracting a transaction from a finalized PSBT
  try {
    const {transaction} = extractTransaction({ecp, psbt});

    return {transaction};
  } catch {
    // Ignore errors when transaction extraction fails
  }

  // Attempt extraction a transaction from a non-final PSBT
  try {
    const finalized = finalizePsbt({ecp, psbt});

    const {transaction} = extractTransaction({ecp, psbt: finalized.psbt});

    return {transaction};
  } catch {
    // Ignore errors when the transaction cannot be extracted
  }

  // Return nothing when there are no remaining options to extract a tx
  return {};
};
