import { Transaction } from 'bitcoinjs-lib';

const inputAsOutpoint = (txId, outputIndex) => `${txId}:${outputIndex}`;
const {fromHex} = Transaction;
const sumOf = arr => arr.reduce((sum, n) => sum + n, Number());
const txIdFromHash = hash => hash.slice().reverse().toString('hex');
const uniq = arr => Array.from(new Set(arr));

/** Derive conflicted on-chain pending balances where funds are double spent or
  multiple versions of the spend exist

  {
    transactions: [{
      is_confirmed: <Transaction is Confirmed Bool>
      transaction: <Raw Transaction Hex String>
    }]
    utxos: [{
      confirmation_count: <UTXO Confirmation Count Number>
      tokens: <UTXO Tokens Number>
      transaction_id: <Outpoint Transaction Id Hex String>
    }]
  }

  @returns
  {
    conflicting_pending_balance: <Conflicting Pending Balance Tokens Number>
    invalid_pending_balance: <Invalid Pending Balance Tokens Number>
  }
*/
export default ({transactions, utxos}) => {
  const conflictingUtxos = [];
  const invalidUtxos = [];
  const spends = {}

  // Look at unconfirmed UTXOs and collect spends of outpoints
  for (let i = 0; i < utxos.filter(n => !n.confirmation_count).length; i++){
    const utxo = utxos.filter(n => !n.confirmation_count)[i]
    const tx = transactions.find(n => n.id === utxo.transaction_id);

    // Exit early when the raw transaction is not known
    if (!tx || !tx.transaction) {
      continue
    }

    // Register all the inputs into the spends map
    for (const input of fromHex(tx.transaction).ins) {
      const outpoint = inputAsOutpoint(txIdFromHash(input.hash), input.index);

      const existing = spends[outpoint];

      // When existing UTXO spends the same input this is a conflict
      if (existing) {
        conflictingUtxos.push(i);
      }

      // Collect spends of the outpoint
      const spending = existing ? [].concat(existing).concat(i) : [i];

      spends[outpoint] = spending
    }
  }

  // Look at confirmed txs and see if any unspents spend a confirmed outpoint
  for (const tx of transactions) {
    // Exit early when there is no confirmed tx
    if (!tx.transaction || !tx.is_confirmed) {
      continue
    }

    // Look for pending inputs that are conflicted with a confirmed tx
    for (const input of fromHex(tx.transaction).ins) {
      const outpoint = inputAsOutpoint(txIdFromHash(input.hash), input.index);

      // Exit early when nothing pending spends this outpoint
      if (!spends[outpoint]) {
        continue
      }

      // Pending things that spend a confirmed input are invalid
      for (const n of spends[outpoint]) {
        invalidUtxos.push(n)
      }
    }
  }

  const conflictingTokens = uniq(conflictingUtxos)
    .filter(utxoIndex => !invalidUtxos.includes(utxoIndex))
    .map(n => utxos[n].tokens);

  const invalidTokens = uniq(invalidUtxos).map(n => utxos[n].tokens);

  return {
    conflicting_pending_balance: sumOf(conflictingTokens),
    invalid_pending_balance: sumOf(invalidTokens),
  };
};
