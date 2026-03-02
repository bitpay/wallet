import { Injectable } from '@angular/core';

import { BwcProvider } from '../bwc/bwc';

@Injectable()
export class ZceProvider {
  private bwcUtils;
  private bitcoreLibCash;
  constructor(private bwcProvider: BwcProvider) {
    this.bwcUtils = this.bwcProvider.getUtils();
    this.bitcoreLibCash = this.bwcProvider.getBitcoreCash();
  }

  public generateEscrowReclaimTxp(wallet, signedTxp) {
    const reclaimAddress = this.createReclaimAddress(
      wallet,
      signedTxp.escrowAddress.path
    );
    const minFeeRate = signedTxp.feePerKb / 1000;
    const zceTx = new this.bitcoreLibCash.Transaction(signedTxp.raw);
    const outputIndex = this.getEscrowOutputIndex(
      zceTx,
      signedTxp.escrowAddress
    );
    const escrowSatoshis = zceTx.outputs[outputIndex].satoshis;
    const reclaimTxSize = getEscrowReclaimTxSize(signedTxp.inputs.length);
    const reclaimTxFee = minFeeRate * reclaimTxSize;
    const outputAmount = escrowSatoshis - reclaimTxFee;
    const reclaimTxp = {
      addressType: 'P2PKH',
      changeAddress: reclaimAddress,
      coin: 'bch',
      dryRun: false,
      excludeUnconfirmedUtxos: false,
      fee: reclaimTxFee,
      from: signedTxp.escrowAddress.address,
      inputs: [
        {
          address: signedTxp.escrowAddress.address,
          satoshis: escrowSatoshis,
          txid: signedTxp.txid,
          vout: outputIndex,
          path: signedTxp.escrowAddress.path,
          publicKeys: signedTxp.escrowAddress.publicKeys
        }
      ],
      outputs: [
        {
          toAddress: reclaimAddress.address,
          amount: outputAmount,
          message: null
        }
      ],
      signingMethod: 'schnorr'
    };
    return reclaimTxp;
  }

  public generateEscrowReclaimRawTx(
    signedTxp,
    reclaimTxp,
    reclaimSignatureSring
  ) {
    const t = this.bwcUtils.buildTx(reclaimTxp);
    const signature = this.bitcoreLibCash.crypto.Signature.fromString(
      reclaimSignatureSring
    );
    const transactionSignature = this.bitcoreLibCash.Transaction.Signature({
      publicKey: signedTxp.escrowAddress.publicKeys[0],
      prevTxId: signedTxp.txid,
      outputIndex: 0,
      inputIndex: 0,
      signature,
      sigtype: 0x41
    });
    t.applySignature(transactionSignature, 'schnorr');
    return t.serialize();
  }

  private createReclaimAddress(wallet, escrowAddressPath) {
    const reclaimAddressPath = getReclaimAddressPath(escrowAddressPath);
    const reclaimAddress = this.bwcUtils.deriveAddress(
      wallet.credentials.addressType,
      wallet.credentials.publicKeyRing,
      reclaimAddressPath,
      wallet.credentials.m,
      wallet.network,
      wallet.coin
    );
    wallet.createAddress({ isChange: true }, () => {});
    return reclaimAddress;
  }

  private getEscrowOutputIndex(zceTx, escrowAddress) {
    const outputAddresses = zceTx.outputs.map(output =>
      output.script.toAddress(escrowAddress.network).toString().split(':').pop()
    );
    return outputAddresses.indexOf(escrowAddress.address);
  }
}

function getReclaimAddressPath(escrowAddressPath) {
  const escrowAddressIndex = parseInt(
    escrowAddressPath.split('/').slice(2)[0],
    10
  );
  const reclaimAddressIndex = escrowAddressIndex + 1;
  const reclaimAddressPath = escrowAddressPath
    .split('/')
    .slice(0, 2)
    .concat([reclaimAddressIndex.toString()])
    .join('/');
  return reclaimAddressPath;
}

function getEscrowReclaimTxSize(numInputs) {
  const baseSize = 186;
  const baseRedeemScriptSize = 39;

  const merkleValidationScriptSize = numInputs => {
    const numLevels = Math.ceil(Math.log2(numInputs));
    const opPickIndexBytes = numLevels < 17 ? 1 : 2;
    const baseMerkleInputValidationSize = 24 + opPickIndexBytes;
    const additionalBytesPerLevel = 7;
    return baseMerkleInputValidationSize + additionalBytesPerLevel * numLevels;
  };

  const inputValidationScriptSize =
    numInputs === 1 ? 24 : merkleValidationScriptSize(numInputs);
  const redeemScriptSize = baseRedeemScriptSize + inputValidationScriptSize;

  const pushDataBytes =
    redeemScriptSize < 76 ? 0 : redeemScriptSize < 256 ? 1 : 2;

  const txSize = baseSize + redeemScriptSize + pushDataBytes;
  return txSize;
}
