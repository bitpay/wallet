import { Injectable } from '@angular/core';
import { BwcProvider } from '../../providers/bwc/bwc';

@Injectable()
export class AddressProvider {
  private bitcore: any;
  private bitcoreCash: any;
  private Bitcore: any;

  constructor(
    private bwcProvider: BwcProvider,
  ) {
    this.bitcore = this.bwcProvider.getBitcore();
    this.bitcoreCash = this.bwcProvider.getBitcoreCash();
    this.Bitcore = {
      'btc': {
        lib: this.bitcore,
        translateTo: 'bch'
      },
      'bch': {
        lib: this.bitcoreCash,
        translateTo: 'btc'
      }
    };
  }

  getCoin(address: string) {
    try {
      new this.Bitcore['btc'].lib.Address(address);
      return 'btc';
    } catch (e) {
      try {
        new this.Bitcore['bch'].lib.Address(address);
        return 'bch';
      } catch (e) {
        return null;
      }
    }
  };

  translateAddress(address: string) {
    var origCoin = this.getCoin(address);
    if (!origCoin) return;

    var origAddress = new this.Bitcore[origCoin].lib.Address(address);
    var origObj = origAddress.toObject();

    var resultCoin = this.Bitcore[origCoin].translateTo;
    var resultAddress = this.Bitcore[resultCoin].lib.Address.fromObject(origObj);
    return {
      origCoin: origCoin,
      origAddress: address,
      resultCoin: resultCoin,
      resultAddress: resultAddress.toString()
    };
  };

  validateAddress(address: string) {
    let Address = this.bitcore.Address;
    let AddressCash = this.bitcoreCash.Address;
    let isLivenet = Address.isValid(address, 'livenet');
    let isTestnet = Address.isValid(address, 'testnet');
    let isLivenetCash = AddressCash.isValid(address, 'livenet');
    return {
      address: address,
      isValid: isLivenet || isTestnet || isLivenetCash,
      network: isTestnet ? 'testnet' : 'livenet',
      coin: this.getCoin(address),
      translation: this.translateAddress(address),
    };
  }
}