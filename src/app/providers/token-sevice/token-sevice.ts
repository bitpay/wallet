import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Logger } from '../logger/logger';
import BCHJS from '@abcpros/xpi-js';
import { AddressProvider } from '../address/address';
import { Token, TokenInfo, UtxoToken } from 'src/app/models/tokens/tokens.model';

@Injectable({
  providedIn: 'root'
})
export class TokenProvider {
  bchjs;
  chronikClient;
  constructor(
    private logger: Logger,
    private addressProvider: AddressProvider
  ) {
    this.logger.debug('TokenProvider initialized');
    this.bchjs = new BCHJS({ restURL: '' });
  }

  public getTokens(wallet): Promise<Token[]> {
    return new Promise((resolve, reject) => {
      wallet.getTokens(
        {
          coin: wallet.coin
        },
        (err, resp) => {
          if (err)
            return reject(err);
          return resolve(resp);
        }
      );
    });
  }

  public broadcast_raw(wallet, raw, ischronik) {
    return new Promise((resolve, reject) => {
      wallet.broadcastRawTx(
        {
          rawTx: raw,
          network: 'livenet',
          coin: wallet.coin,
          ischronik: ischronik
        },
        (err, txid) => {
          if (err || !txid)
            return reject(err ? err : 'No Tokens');
          return resolve(txid);
        }
      );
    });
  }

  public getUtxosToken(wallet): Promise<UtxoToken[]> {
    return new Promise((resolve, reject) => {
      wallet.getUtxosToken(
        {
          coin: wallet.coin
        },
        (err, resp) => {
          if (err || !resp || !resp.length)
            return reject(err ? err : 'No Tokens');
          return resolve(resp);
        }
      );
    });
  }

  async sendToken(wallet, mnemonic, tokenInfo, TOKENQTY, etokenAddress) {
    const rootSeed = await this.bchjs.Mnemonic.toSeed(mnemonic);
    // master HDNode
    let masterHDNode;
    masterHDNode = this.bchjs.HDNode.fromSeed(rootSeed);

    // HDNode of BIP44 account
    const account = this.bchjs.HDNode.derivePath(masterHDNode, "m/44'/1899'/0'");
    const change = this.bchjs.HDNode.derivePath(account, '0/0');

    const cashAddress = this.bchjs.HDNode.toCashAddress(change);
    const slpAddress = this.bchjs.HDNode.toSLPAddress(change);

    // Generate an EC key pair for signing the transaction.
    const keyPair = this.bchjs.HDNode.toKeyPair(change);

    // Get a UTXO 
    const utxos : UtxoToken[] = await this.getUtxosToken(wallet);

    if (utxos.length === 0) throw new Error('No UTXOs to spend! Exiting.');

    const bchUtxos = _.filter(utxos, item => item.isNonSLP);

    if (bchUtxos.length === 0) {
      throw new Error('Wallet does not have a BCH UTXO to pay miner fees.');
    }
    const tokenUtxos = await this.getTokenUtxos(utxos, tokenInfo);

    if (tokenUtxos.length === 0) {
      throw new Error('No token UTXOs for the specified token could be found.');
    }

    // Choose a UTXO to pay for the transaction.
    const bchUtxo = this.findBiggestUtxo(bchUtxos);
    // console.log(`bchUtxo: ${JSON.stringify(bchUtxo, null, 2)}`);

    // Generate the OP_RETURN code.
    const slpSendObj = this.bchjs.SLP.TokenType1.generateSendOpReturn(
      tokenUtxos,
      TOKENQTY
    )
    const slpData = slpSendObj.script;

    // BEGIN transaction construction.

    // instance of transaction builder
    let transactionBuilder;
    transactionBuilder = new this.bchjs.TransactionBuilder();


    // Add the BCH UTXO as input to pay for the transaction.
    const originalAmount = bchUtxo.value;
    transactionBuilder.addInput(bchUtxo.txid, bchUtxo.outIdx);

    // add each token UTXO as an input.
    for (let i = 0; i < tokenUtxos.length; i++) {
      transactionBuilder.addInput(tokenUtxos[i].txid, tokenUtxos[i].outIdx);
    }

    const txFee = 250;

    // amount to send back to the sending address. It's the original amount - 1 sat/byte for tx size
    const remainder = originalAmount - txFee - 546 * 2;
    if (remainder < 1) {
      throw new Error('Selected UTXO does not have enough satoshis')
    }

    // Add OP_RETURN as first output.
    transactionBuilder.addOutput(slpData, 0);

    // Send the token back to the same wallet if the user hasn't specified a
    // different address.

    // Send dust transaction representing tokens being sent.
    const { prefix, type, hash } = this.addressProvider.decodeAddress(etokenAddress);
    const cashAdress = this.addressProvider.encodeAddress('bitcoincash', type, hash, etokenAddress);
    transactionBuilder.addOutput(
      this.bchjs.SLP.Address.toLegacyAddress(cashAdress),
      546
    )

    // Return any token change back to the sender.
    if (slpSendObj.outputs > 1) {
      transactionBuilder.addOutput(
        this.bchjs.SLP.Address.toLegacyAddress(slpAddress),
        546
      )
    }

    // Last output: send the BCH change back to the wallet.
    transactionBuilder.addOutput(
      this.bchjs.Address.toLegacyAddress(cashAddress),
      remainder
    )

    // Sign the transaction with the private key for the BCH UTXO paying the fees.
    let redeemScript;
    transactionBuilder.sign(
      0,
      keyPair,
      redeemScript,
      transactionBuilder.hashTypes.SIGHASH_ALL,
      originalAmount
    )

    // Sign each token UTXO being consumed.
    for (let i = 0; i < tokenUtxos.length; i++) {
      const thisUtxo = tokenUtxos[i];

      transactionBuilder.sign(
        1 + i,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        thisUtxo.value
      )
    }

    // build tx
    const tx = transactionBuilder.build();

    // output rawhex
    const hex = tx.toHex();
    const txid = await this.broadcast_raw(wallet, hex, true);
    return txid;
  }

  getTokenUtxos(utxos : UtxoToken[], tokenInfo : TokenInfo) : UtxoToken[] {
    const tokenUtxos = [];
    _.forEach(utxos, item => {
      const slpMeta = _.get(item, 'slpMeta', undefined);
      // UTXO is not a minting baton.
      if (item.amountToken && slpMeta.tokenId && slpMeta.tokenId === tokenInfo.id && slpMeta.txType != "MINT") {
        const tokenUtxo  : UtxoToken = {
          txid: item.txid,
          outIdx: item.outIdx,
          value: item.value,
          decimals: tokenInfo.decimals,
          tokenId: tokenInfo.id,
          tokenQty: item.amountToken / Math.pow(10, tokenInfo.decimals),
          amountToken: item.amountToken
        }
        tokenUtxos.push(tokenUtxo);
      }
    })
    return tokenUtxos;
  }

  private findBiggestUtxo(utxos: UtxoToken[]) {
    let largestAmount = 0;
    let largestIndex = 0;

    for (var i = 0; i < utxos.length; i++) {
      const thisUtxo = utxos[i];

      if (thisUtxo.value > largestAmount) {
        largestAmount = thisUtxo.value;
        largestIndex = i;
      }
    }
    return utxos[largestIndex];
  }
}
