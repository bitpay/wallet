import { Injectable } from '@angular/core';

import bwc from 'bitcore-wallet-client/index';

@Injectable()
export class BwcService {

    Client = bwc;
    buildTx = this.Client.buildTx;
    parseSecret = this.Client.parseSecret;

    getBitcore() {
      return this.Client.Bitcore;
    }

    getErrors() {
      return this.Client.errors
    }

    getSJCL() {
      return this.Client.sjcl;
    }

    getUtils() {
      return this.Client.Utils;
    }

    getClient(walletData, opts) {
      opts = opts || {};

      let client = new this.Client({
        baseUrl: opts.bwsurl || 'https://bws.bitpay.com/bws/api',
        verbose: opts.verbose,
        transports: ['polling']
      });
      if (walletData) {
        client.import(walletData, opts);
      }
    }
}
