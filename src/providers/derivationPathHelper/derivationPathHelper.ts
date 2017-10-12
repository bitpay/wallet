import { Injectable } from '@angular/core';

@Injectable()
export class DerivationPathHelperProvider {
  public default: string;
  public defaultTestnet: string;

  public constructor() {
    this.default = "m/44'/0'/0'";
    this.defaultTestnet = "m/44'/1'/0'";
  }

  parse(str: string) {
    var arr = str.split('/');
    var ret = {
      derivationStrategy: '',
      networkName: '',
      account: 0
    };

    if (arr[0] != 'm')
      return false;

    switch (arr[1]) {
      case "44'":
        ret.derivationStrategy = 'BIP44';
        break;
      case "45'":
        return {
          derivationStrategy: 'BIP45',
          networkName: 'livenet',
          account: 0,
        }
      case "48'":
        ret.derivationStrategy = 'BIP48';
        break;
      default:
        return false;
    };

    switch (arr[2]) {
      case "0'":
        ret.networkName = 'livenet';
        break;
      case "1'":
        ret.networkName = 'testnet';
        break;
      default:
        return false;
    };

    var match = arr[3].match(/(\d+)'/);
    if (!match)
      return false;
    ret.account = +match[1]

    return ret;
  };
}