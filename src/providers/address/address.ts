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

  public getCoin(address: string): string {
    let extractedAddress = this.extractAddress(address);
    try {
      new this.Bitcore['btc'].lib.Address(extractedAddress);
      return 'btc';
    } catch (e) {
      try {
        new this.Bitcore['bch'].lib.Address(extractedAddress);
        return 'bch';
      } catch (e) {
        return null;
      }
    }
  }

  public getNetwork(address: string): string {
    const extractedAddress = this.extractAddress(address);
    let network;
    try {
      network = this.bwcProvider.getBitcore().Address(extractedAddress).network.name;
    } catch (e) {
      try {
        network = this.bwcProvider.getBitcoreCash().Address(extractedAddress).network
          .name;
      } catch (e) { }
    }
    return network;
  }

  public checkCoinAndNetworkFromAddr(
    coin: string,
    network: string,
    address: string
  ): boolean {
    if (this.isValid(address)) {
      const extractedAddress = this.extractAddress(address);
      return this.getCoin(extractedAddress) == coin && this.getNetwork(extractedAddress) == network
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

  public extractAddress(address: string): string {
    const extractedAddress = address
      .replace(/^(bitcoincash:|bchtest:|bitcoin:)/i, '')
      .replace(/\?.*/, '');
    return extractedAddress || address;
  }

  public isValid(address: string): boolean {
    const URI = this.bitcore.URI;
    const Address = this.bitcore.Address;
    const URICash = this.bitcoreCash.URI;
    const AddressCash = this.bitcoreCash.Address;

    // Bip21 uri
    let uri, isAddressValidLivenet, isAddressValidTestnet;
    if (/^bitcoin:/.test(address)) {
      const isUriValid = URI.isValid(address);
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
    } else if (/^bitcoincash:/i.test(address) || /^bchtest:/i.test(address)) {
      const isUriValid = URICash.isValid(address);
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
    const regularAddressLivenet = Address.isValid(address, 'livenet');
    const regularAddressTestnet = Address.isValid(address, 'testnet');
    const regularAddressCashLivenet = AddressCash.isValid(address, 'livenet');
    const regularAddressCashTestnet = AddressCash.isValid(address, 'testnet');
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
