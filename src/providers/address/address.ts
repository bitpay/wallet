import { Injectable } from '@angular/core';

// Providers
import { BwcProvider } from '../../providers/bwc/bwc';

@Injectable()
export class AddressProvider {
  private bitcore;
  private bitcoreCash;
  private core;

  constructor(private bwcProvider: BwcProvider) {
    this.bitcore = this.bwcProvider.getBitcore();
    this.bitcoreCash = this.bwcProvider.getBitcoreCash();
    this.core = this.bwcProvider.getCore();
  }

  public extractAddress(str: string): string {
    const extractedAddress = str.replace(/^[a-z]+:/i, '').replace(/\?.*/, '');
    return extractedAddress;
  }

  public getCoinAndNetwork(str: string): any {
    const address = this.extractAddress(str);
    let network = null;
    try {
      network = this.bitcore.Address(address).network.name;
      return { coin: 'btc', network };
    } catch (e) {
      try {
        network = this.bitcoreCash.Address(address).network.name;
        return { coin: 'bch', network };
      } catch (e) {
        try {
          const isValidEthAddress = this.core.Validation.validateAddress(
            'ETH',
            'livenet',
            address
          );
          if (isValidEthAddress) {
            return { coin: 'eth', network: 'any' };
          } else {
            return null;
          }
        } catch (e) {
          return null;
        }
      }
    }
  }
  //  public checkCoinAndNetworkFromAddr(
  //  public checkCoinAndNetworkFromPayPro(

  public isValid(str: string): boolean {
    // Check if the input is a valid uri or address
    const URI = this.bitcore.URI;
    const Address = this.bitcore.Address;
    const URICash = this.bitcoreCash.URI;
    const AddressCash = this.bitcoreCash.Address;
    const AddressEth = this.core.Validation;

    // Bip21 uri
    if (URI.isValid(str)) return true;
    if (URICash.isValid(str)) return true;
    if (AddressEth.validateUri('ETH', str)) return true;

    // Regular Address: try Bitcoin and Bitcoin Cash
    if (Address.isValid(str, 'livenet')) return true;
    if (Address.isValid(str, 'testnet')) return true;
    if (AddressCash.isValid(str, 'livenet')) return true;
    if (AddressCash.isValid(str, 'testnet')) return true;
    if (AddressEth.validateAddress('ETH', 'livenet', str)) return true;

    return false;
  }
}
