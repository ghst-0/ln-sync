import { Transaction } from 'bitcoinjs-lib';

const {fromHex} = Transaction;

/** Determine if a string can be decoded as a transaction

  {
    input: <Transaction Hex String>
  }

  @returns
  {
    is_transaction: <String is Encoded Transaction Bool>
  }
*/
const isEncodedTransaction = ({input}) => {
  try {
    return {is_transaction: !!fromHex(input)};
  } catch {
    return {is_transaction: false};
  }
};

export { isEncodedTransaction }
