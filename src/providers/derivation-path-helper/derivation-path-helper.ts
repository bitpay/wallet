import { Injectable } from '@angular/core';

@Injectable()
export class DerivationPathHelperProvider {
  public defaultBTC: string;
  public defaultBCH: string;
  public defaultTestnet: string;

  public constructor() {
    this.defaultBTC = "m/44'/0'/0'";
    this.defaultBCH = "m/44'/145'/0'";
    this.defaultTestnet = "m/44'/1'/0'";
  }

  public getDerivationStrategy(path: string): string {
    const purpose = path.split('/')[1];
    let derivationStrategy: string;

    switch (purpose) {
      case "44'":
        derivationStrategy = 'BIP44';
        break;
      case "45'":
        derivationStrategy = 'BIP45';
        break;
      case "48'":
        derivationStrategy = 'BIP48';
        break;
    }
    return derivationStrategy;
  }

  public getNetworkName(path: string): string {
    const coinType = path.split('/')[2];
    let networkName: string;

    switch (coinType) {
      case "0'": // for BTC
        networkName = 'livenet';
        break;
      case "1'": // testnet for all coins
        networkName = 'testnet';
        break;
      case "145'": // for BCH
        networkName = 'livenet';
        break;
    }
    return networkName;
  }

  public getAccount(path: string): number {
    const match = path.split('/')[3].match(/(\d+)'/);
    if (!match) return undefined;
    return +match[1];
  }

  public isValidDerivationPathCoin(path: string, coin: string): boolean {
    let isValid: boolean;
    const coinType = path.split('/')[2];

    switch (coin) {
      case 'btc':
        isValid = ["0'", "1'"].indexOf(coinType) > -1;
        break;
      case 'bch':
        isValid = ["145'", "0'", "1'"].indexOf(coinType) > -1;
        break;
    }

    return isValid;
  }
}
