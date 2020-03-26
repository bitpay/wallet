import { Injectable } from '@angular/core';

// Providers
import { BwcProvider } from '../../providers/bwc/bwc';
import { Logger } from '../../providers/logger/logger';

export interface CoinNetwork {
  coin: string;
  network: string;
}
@Injectable()
export class AddressProvider {
  private bitcore;
  private bitcoreCash;
  private core;

  constructor(private bwcProvider: BwcProvider, private logger: Logger) {
    this.bitcore = this.bwcProvider.getBitcore();
    this.bitcoreCash = this.bwcProvider.getBitcoreCash();
    this.core = this.bwcProvider.getCore();
  }

  public translateToCashAddress(addressToTranslate: string): string {
    var addressObj = this.bitcore.Address(addressToTranslate).toObject();
    const cashAdrr = this.bitcoreCash.Address.fromObject(
      addressObj
    ).toCashAddress();
    this.logger.info(`converted: ${addressToTranslate} -> ${cashAdrr}`);
    return cashAdrr;
  }

  public extractAddress(str: string): string {
    const extractedAddress = str.replace(/^[a-z]+:/i, '').replace(/\?.*/, '');
    return extractedAddress;
  }

  public getCoinAndNetwork(
    str: string,
    network: string = 'livenet'
  ): CoinNetwork {
    const address = this.extractAddress(str);
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
            network,
            address
          );
          if (isValidEthAddress) {
            return { coin: 'eth', network };
          } else {
            throw isValidEthAddress;
          }
        } catch (e) {
          try {
            const isValidXrpAddress = this.core.Validation.validateAddress(
              'XRP',
              network,
              address
            );
            if (isValidXrpAddress) {
              return { coin: 'xrp', network };
            } else {
              return null;
            }
          } catch (e) {
            return null;
          }
        }
      }
    }
  }

  public isValid(str: string): boolean {
    if (!str) return false;
    // Check if the input is a valid uri or address
    const URI = this.bitcore.URI;
    const Address = this.bitcore.Address;
    const URICash = this.bitcoreCash.URI;
    const AddressCash = this.bitcoreCash.Address;
    const { Validation } = this.core;

    // Bip21 uri
    if (URI.isValid(str)) return true;
    if (URICash.isValid(str)) return true;
    if (Validation.validateUri('ETH', str)) return true;
    if (Validation.validateUri('XRP', str)) return true;

    // Regular Address: try Bitcoin and Bitcoin Cash
    if (Address.isValid(str, 'livenet')) return true;
    if (Address.isValid(str, 'testnet')) return true;
    if (AddressCash.isValid(str, 'livenet')) return true;
    if (AddressCash.isValid(str, 'testnet')) return true;
    if (Validation.validateAddress('XRP', 'livenet', str)) return true;
    if (Validation.validateAddress('ETH', 'livenet', str)) return true;

    return false;
  }

  public getLegacyBchAddressFormat(addr: string): string {
    const a = this.bitcoreCash.Address(addr).toObject();
    return this.bitcore.Address.fromObject(a).toString();
  }
}
