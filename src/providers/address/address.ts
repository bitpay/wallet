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

  public getCoin(address: string) {
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
  }

  private translateAddress(address: string) {
    var origCoin = this.getCoin(address);
    if (!origCoin) return undefined;

    var origAddress = new this.Bitcore[origCoin].lib.Address(address);
    var origObj = origAddress.toObject();

    var resultCoin = this.Bitcore[origCoin].translateTo;
    var resultAddress = this.Bitcore[resultCoin].lib.Address.fromObject(
      origObj
    );
    return {
      origCoin,
      origAddress: address,
      resultCoin,
      resultAddress: resultAddress.toString()
    };
  }

  public validateAddress(address: string) {
    let Address = this.bitcore.Address;
    let AddressCash = this.bitcoreCash.Address;
    let isLivenet = Address.isValid(address, 'livenet');
    let isTestnet = Address.isValid(address, 'testnet');
    let isLivenetCash = AddressCash.isValid(address, 'livenet');
    let isTestnetCash = AddressCash.isValid(address, 'testnet');
    return {
      address,
      isValid: isLivenet || isTestnet || isLivenetCash || isTestnetCash,
      network: isTestnet || isTestnetCash ? 'testnet' : 'livenet',
      coin: this.getCoin(address),
      translation: this.translateAddress(address)
    };
  }

  public checkCoinAndNetwork(
    coin: string,
    network: string,
    address: string
  ): boolean {
    let addressData;
    address = coin === 'bch' ? address.toLowerCase() : address;
    if (this.isValid(address)) {
      let extractedAddress = this.extractAddress(address);
      addressData = this.validateAddress(extractedAddress);
      return addressData.coin == coin
        ? addressData.network == network
          ? true
          : false
        : false;
    } else {
      return false;
    }
  }

  public extractAddress(address: string): string {
    let extractedAddress = address
      .replace(/^(bitcoincash:|bchtest:|bitcoin:)/, '')
      .replace(/\?.*/, '');
    return extractedAddress || address;
  }

  public isValid(address: string): boolean {
    let URI = this.bitcore.URI;
    let Address = this.bitcore.Address;
    let URICash = this.bitcoreCash.URI;
    let AddressCash = this.bitcoreCash.Address;

    // Bip21 uri
    let uri, isAddressValidLivenet, isAddressValidTestnet;
    if (/^bitcoin:/.test(address)) {
      let isUriValid = URI.isValid(address);
      if (isUriValid) {
        uri = new URI(address);
        isAddressValidLivenet = Address.isValid(
          uri.address.toString(),
          'livenet'
        );
        isAddressValidTestnet = Address.isValid(
          uri.address.toString(),
          'testnet'
        );
      }
      if (isUriValid && (isAddressValidLivenet || isAddressValidTestnet)) {
        return true;
      }
    } else if (/^bitcoincash:/.test(address) || /^bchtest:/.test(address)) {
      let isUriValid = URICash.isValid(address);
      if (isUriValid) {
        uri = new URICash(address);
        isAddressValidLivenet = AddressCash.isValid(
          uri.address.toString(),
          'livenet'
        );
        isAddressValidTestnet = AddressCash.isValid(
          uri.address.toString(),
          'testnet'
        );
      }
      if (isUriValid && (isAddressValidLivenet || isAddressValidTestnet)) {
        return true;
      }
    }

    // Regular Address: try Bitcoin and Bitcoin Cash
    let regularAddressLivenet = Address.isValid(address, 'livenet');
    let regularAddressTestnet = Address.isValid(address, 'testnet');
    let regularAddressCashLivenet = AddressCash.isValid(address, 'livenet');
    let regularAddressCashTestnet = AddressCash.isValid(address, 'testnet');
    if (
      regularAddressLivenet ||
      regularAddressTestnet ||
      regularAddressCashLivenet ||
      regularAddressCashTestnet
    ) {
      return true;
    }

    return false;
  }
}
