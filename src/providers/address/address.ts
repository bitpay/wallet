import { Injectable } from '@angular/core';

// Providers
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

  public getCoin(address: string) {
    try {
      new this.Bitcore.btc.lib.Address(address);
      return 'btc';
    } catch (e) {
      try {
        new this.Bitcore.bch.lib.Address(address);
        return 'bch';
      } catch (e) {
        return null;
      }
    }
  };

  public translateAddress(address: string) {
    const origCoin = this.getCoin(address);
    if (!origCoin) { return; }

    const origAddress = new this.Bitcore[origCoin].lib.Address(address);
    const origObj = origAddress.toObject();

    const resultCoin = this.Bitcore[origCoin].translateTo;
    const resultAddress = this.Bitcore[resultCoin].lib.Address.fromObject(origObj);
    return {
      origCoin,
      origAddress: address,
      resultCoin,
      resultAddress: resultAddress.toString()
    };
  };

  public validateAddress(address: string) {
    const Address = this.bitcore.Address;
    const AddressCash = this.bitcoreCash.Address;
    const isLivenet = Address.isValid(address, 'livenet');
    const isTestnet = Address.isValid(address, 'testnet');
    const isLivenetCash = AddressCash.isValid(address, 'livenet');
    return {
      address,
      isValid: isLivenet || isTestnet || isLivenetCash,
      network: isTestnet ? 'testnet' : 'livenet',
      coin: this.getCoin(address),
      translation: this.translateAddress(address),
    };
  }
}