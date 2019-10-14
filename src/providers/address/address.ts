import { Injectable } from '@angular/core';

// Providers
import { BwcProvider } from '../../providers/bwc/bwc';

@Injectable()
export class AddressProvider {
  private bitcore;
  private bitcoreCash;
  private Bitcore;
  private core;

  constructor(private bwcProvider: BwcProvider) {
    this.bitcore = this.bwcProvider.getBitcore();
    this.bitcoreCash = this.bwcProvider.getBitcoreCash();
    this.core = this.bwcProvider.getCore();
    this.Bitcore = {
      btc: {
        lib: this.bitcore,
        translateTo: 'bch'
      },
      bch: {
        lib: this.bitcoreCash,
        translateTo: 'btc'
      },
      eth: {
        lib: this.core,
        translateTo: 'eth'
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
          const isValidEthAddress = this.core.Validation.validateAddress(
            'ETH',
            'livenet',
            address
          );
          if (isValidEthAddress) {
            return 'eth';
          } else {
            return null;
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
      network = this.bitcore.Address(address).network.name;
    } catch (e) {
      try {
        network = this.bitcoreCash.Address(address).network.name;
      } catch (e) {
        try {
          const isValidEthAddress = this.core.Validation.validateAddress(
            'ETH',
            'livenet',
            address
          );
          if (isValidEthAddress) {
            network = 'livenet';
          }
        } catch (e) {}
      }
    }
    return network;
  }

  public checkCoinAndNetworkFromAddr(
    coin: string,
    network: string,
    str: string
  ): boolean {
    if (this.isValid(str)) {
      const address = this.extractAddress(str);
      return this.getCoin(address) == coin &&
        this.getNetwork(address) == network
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
      .replace(/^(bitcoincash:|bchtest:|bitcoin:|ethereum:)/i, '')
      .replace(/\?.*/, '');
    return extractedAddress;
  }

  public isValid(str: string): boolean {
    // Check if the input is a valid uri or address
    const URI = this.bitcore.URI;
    const Address = this.bitcore.Address;
    const URICash = this.bitcoreCash.URI;
    const AddressCash = this.bitcoreCash.Address;
    const AddressEth = this.core.Validation;

    // Bip21 uri
    let uri, uriAddress;
    if (/^bitcoin:/.test(str)) {
      if (URI.isValid(str)) {
        uri = new URI(str);
        uriAddress = uri.address.toString();
        if (Address.isValid(uriAddress, 'livenet')) return true;
        if (Address.isValid(uriAddress, 'testnet')) return true;
      }
    } else if (/^bitcoincash:/i.test(str) || /^bchtest:/i.test(str)) {
      if (URICash.isValid(str)) {
        uri = new URICash(str);
        uriAddress = uri.address.toString();
        if (AddressCash.isValid(uriAddress, 'livenet')) return true;
        if (AddressCash.isValid(uriAddress, 'testnet')) return true;
      }
    } else if (/^ethereum:/i.test(str)) {
      if (AddressEth.validateUri('ETH', str)) return true;
    }

    // Regular Address: try Bitcoin and Bitcoin Cash
    if (Address.isValid(str, 'livenet')) return true;
    if (Address.isValid(str, 'testnet')) return true;
    if (AddressCash.isValid(str, 'livenet')) return true;
    if (AddressCash.isValid(str, 'testnet')) return true;
    if (AddressEth.validateAddress('ETH', 'livenet', str)) return true;

    return false;
  }
}
