// tslint:disable-next-line:no-var-requires
const CWC = require('crypto-wallet-core').default;

import { Injectable } from '@angular/core';

// Providers
import { BwcProvider } from '../../providers/bwc/bwc';

@Injectable()
export class AddressProvider {
  private bitcore;
  private bitcoreCash;
  private Bitcore;

  constructor(private bwcProvider: BwcProvider) {
    this.bitcore = this.bwcProvider.getBitcore();
    this.bitcoreCash = this.bwcProvider.getBitcoreCash();
    this.Bitcore = {
      btc: {
        lib: this.bitcore,
        translateTo: 'bch'
      },
      bch: {
        lib: this.bitcoreCash,
        translateTo: 'btc'
      }
    };
  }

  public getCoin(str: string): string {
    const address = this.extractAddress(str);
    try {
      new this.Bitcore['btc'].lib.Address(address);
      return 'btc';
    } catch (e) {
      try {
        new this.Bitcore['bch'].lib.Address(address);
        return 'bch';
      } catch (e) {
        try {
          if (CWC.validation.validateAddress('eth', 'livenet', address)) {
          return 'eth';
          } else {
            return null
          }
        } catch (e) {
          return null;
        }
      }
    }
  }

  public getNetwork(str: string): string {
    const address = this.extractAddress(str);
    let network;
    try {
      network = this.bwcProvider.getBitcore().Address(address).network.name;
    } catch (e) {
      try {
        network = this.bwcProvider.getBitcoreCash().Address(address).network
          .name;
      } catch (e) {}
    }
    return network;
  }

  public checkCoinAndNetworkFromAddr(
    coin: string,
    _network: string,
    str: string
  ): boolean {
    if (this.isValid(str)) {
      const address = this.extractAddress(str);
      return this.getCoin(address) == coin
        ? true
        : false;
    } else {
      return false;
    }
  }

  public checkCoinAndNetworkFromPayPro(
    coin: string,
    network: string,
    payProDetails
  ): boolean {
    return payProDetails.coin == coin && payProDetails.network == network
      ? true
      : false;
  }

  public extractAddress(str: string): string {
    const extractedAddress = str
      .replace(/^(bitcoincash:|bchtest:|bitcoin:)/i, '')
      .replace(/\?.*/, '');
    return extractedAddress;
  }
  // Need to pass in coin and network later. fix tests
  public isValid(str: string): boolean {
    if (CWC.validation.validateAddress('btc', 'livenet', str)) return true;
    if (CWC.validation.validateAddress('btc', 'testnet', str)) return true;
    if (CWC.validation.validateAddress('bch', 'livenet', str)) return true;
    if (CWC.validation.validateAddress('bch', 'testnet', str)) return true;
    if (CWC.validation.validateAddress('eth', 'livenet', str)) return true;

    return false;
  }
}
