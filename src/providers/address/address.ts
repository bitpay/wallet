import { Injectable } from '@angular/core';

// Providers
import { BwcProvider } from '../../providers/bwc/bwc';
import { Coin, CurrencyProvider } from '../../providers/currency/currency';
import { Logger } from '../../providers/logger/logger';

export interface CoinNetwork {
  coin: string;
  network: string;
}
@Injectable()
export class AddressProvider {
  private bitcore;
  private bitcoreCash;
  private bitcoreDoge;
  private core;

  constructor(
    private bwcProvider: BwcProvider,
    private currencyProvider: CurrencyProvider,
    private logger: Logger
  ) {
    this.bitcore = this.bwcProvider.getBitcore();
    this.bitcoreCash = this.bwcProvider.getBitcoreCash();
    this.bitcoreDoge = this.bwcProvider.getBitcoreDoge();
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

  public getCoinAndNetwork(str: string, network?: string): CoinNetwork {
    const address = this.extractAddress(str);
    this.logger.debug(
      `==== getCoinAndNetwork ${str} - ${network ? network : 'all networks'}`
    );
    console.log(
      `==== getCoinAndNetwork ${str} - ${network ? network : 'all networks'}`,
      new Date().getTime()
    );
    try {
      if (!this.btcAddressPreValidator(address)) {
        throw false;
      }
      const Address = this.bitcore.Address;
      this.logger.debug(`==== getCoinAndNetwork - checking btc`);
      console.log(
        `==== getCoinAndNetwork - checking btc`,
        new Date().getTime()
      );
      if (!network) {
        if (Address.isValid(address, 'livenet')) {
          return { coin: 'btc', network: 'livenet' };
        }
        if (Address.isValid(address, 'testnet')) {
          return { coin: 'btc', network: 'testnet' };
        }
      } else {
        if (Address.isValid(address, network)) {
          return { coin: 'btc', network };
        }
      }
      throw false;
    } catch (e) {
      try {
        this.logger.debug(`==== getCoinAndNetwork - checking bch`);
        console.log(
          `==== getCoinAndNetwork - checking bch`,
          new Date().getTime()
        );
        if (!this.bchAddressPreValidator(address)) {
          throw false;
        }
        const AddressCash = this.bitcoreCash.Address;
        if (!network) {
          if (AddressCash.isValid(address, 'livenet')) {
            return { coin: 'bch', network: 'livenet' };
          }
          if (AddressCash.isValid(address, 'testnet')) {
            return { coin: 'bch', network: 'testnet' };
          }
        } else {
          if (AddressCash.isValid(address, network)) {
            return { coin: 'bch', network };
          }
        }
        throw false;
      } catch (e) {
        try {
          this.logger.debug(`==== getCoinAndNetwork - checking eth`);
          console.log(
            `==== getCoinAndNetwork - checking eth`,
            new Date().getTime()
          );
          const { Validation } = this.core;
          if (
            Validation.validateAddress(
              'ETH',
              network ? network : 'livenet',
              address
            )
          ) {
            return { coin: 'eth', network: network ? network : 'livenet' };
          }
          throw false;
        } catch (e) {
          try {
            this.logger.debug(`==== getCoinAndNetwork - checking xrp`);
            console.log(
              `==== getCoinAndNetwork - checking xrp`,
              new Date().getTime()
            );
            const { Validation } = this.core;
            if (
              Validation.validateAddress(
                'XRP',
                network ? network : 'livenet',
                address
              )
            ) {
              return { coin: 'xrp', network: network ? network : 'livenet' };
            }
            throw false;
          } catch (e) {
            try {
              this.logger.debug(`==== getCoinAndNetwork - checking doge`);
              console.log(
                `==== getCoinAndNetwork - checking doge`,
                new Date().getTime()
              );
              network = this.bitcoreDoge.Address(address).network.name;
              return { coin: 'doge', network };
            } catch (e) {
              return null;
            }
          }
        }
      }
    }
  }

  private btcAddressPreValidator(addr: string) {
    const mainnetRegex = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/;
    const testnetRegex = /^(tb1|[2nm]|bcrt)[a-zA-HJ-NP-Z0-9]{25,40}$/;

    if (mainnetRegex.test(addr)) {
      return true;
    }
    if (testnetRegex.test(addr)) {
      return true;
    }
    return false;
  }

  private bchAddressPreValidator(addr: string) {
    const first = /^([13][a-km-zA-HJ-NP-Z1-9]{25,34})$/;
    const second = /^((q|p)[a-z0-9]{41})$/;
    const third = /^((Q|P)[A-Z0-9]{41})$/;
    const bchBitpay = /^([CH][a-zA-Z0-9]{25,34})$/;

    if (
      first.test(addr) ||
      second.test(addr) ||
      third.test(addr) ||
      bchBitpay.test(addr)
    ) {
      return true;
    }
    return false;
  }

  public isValid(str: string): boolean {
    if (!str) return false;
    // Check if the input is a valid uri or address
    const URI = this.bitcore.URI;
    const Address = this.bitcore.Address;
    const AddressCash = this.bitcoreCash.Address;
    const URICash = this.bitcoreCash.URI;
    const AddressDoge = this.bitcoreDoge.Address;
    const URIDoge = this.bitcoreDoge.URI;
    const { Validation } = this.core;

    // Bip21 uri
    if (URI.isValid(str)) return true;
    if (URICash.isValid(str)) return true;
    if (URIDoge.isValid(str)) return true;
    if (Validation.validateUri('ETH', str)) return true;
    if (Validation.validateUri('XRP', str)) return true;

    // Regular Address: try Bitcoin and Bitcoin Cash
    if (Address.isValid(str, 'livenet')) return true;
    if (Address.isValid(str, 'testnet')) return true;
    if (AddressCash.isValid(str, 'livenet')) return true;
    if (AddressCash.isValid(str, 'testnet')) return true;
    if (AddressDoge.isValid(str, 'livenet')) return true;
    if (AddressDoge.isValid(str, 'testnet')) return true;
    if (Validation.validateAddress('XRP', 'livenet', str)) return true;
    if (Validation.validateAddress('ETH', 'livenet', str)) return true;

    return false;
  }

  public getLegacyBchAddressFormat(addr: string): string {
    const a = this.bitcoreCash.Address(addr).toObject();
    return this.bitcore.Address.fromObject(a).toString();
  }

  public checkCoinAndNetwork(data, network: string, coin: Coin, isPayPro?) {
    let isValid: boolean;
    let addrData: CoinNetwork;
    if (isPayPro) {
      isValid =
        data &&
        data.chain == this.currencyProvider.getChain(coin) &&
        data.network == network;
    } else {
      addrData = this.getCoinAndNetwork(data, network);
      isValid =
        addrData &&
        this.currencyProvider.getChain(coin).toLowerCase() == addrData.coin &&
        addrData.network == network;
      Object.freeze(addrData);
    }
    Object.freeze(isValid);

    if (isValid) {
      return { isValid: true, isLegacy: false, showError: false };
    } else {
      const _network = isPayPro
        ? data.network
        : addrData
        ? addrData.network
        : network;

      if (coin === 'bch' && network === _network) {
        const isLegacy = this.checkIfLegacy(data, _network);
        return { isValid, isLegacy, showError: !isLegacy };
        // isLegacy ? this.showLegacyAddrMessage() : this.showErrorMessage();
      } else {
        return { isValid, isLegacy: false, showError: true };
        // this.showErrorMessage();
      }
    }
  }

  private checkIfLegacy(data, network): boolean {
    return (
      !!this.bwcProvider.getBitcore().Address.isValid(data, network) ||
      !!this.bwcProvider
        .getBitcore()
        .URI.isValid(data.replace(/^(bitcoincash:|bchtest:)/, 'bitcoin:'))
    );
  }
}
