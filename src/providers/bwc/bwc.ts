import { Injectable } from '@angular/core';

import { Logger } from '@nsalaun/ng-logger';

import * as BWC from 'bitcore-wallet-client';

@Injectable()
export class BwcProvider {
  public buildTx = BWC.buildTx;
  public parseSecret = BWC.parseSecret;
  public Client = BWC;
  constructor(
    private logger: Logger
  ) {
    this.logger.info('BwcProvider initialized.');
  }
  public getBitcore(): any {
    return BWC.Bitcore;
  }

  public getBitcoreCash(): any {
    return BWC.BitcoreCash;
  }

  public getErrors(): any {
    return BWC.errors;
  }

  public getSJCL(): any {
    return BWC.sjcl;
  }

  public getUtils(): any {
    return BWC.Utils;
  }

  public getClient(walletData?, opts?): any {
    opts = opts || {};

    //note opts use `bwsurl` all lowercase;
    let bwc = new BWC({
      baseUrl: opts.bwsurl || 'https://bws.bitpay.com/bws/api',
      verbose: opts.verbose,
      timeout: 100000,
      transports: ['polling'],
    });
    if (walletData)
      bwc.import(walletData, opts);
    return bwc;
  }

}
