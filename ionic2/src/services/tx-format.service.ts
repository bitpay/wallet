import { Injectable } from '@angular/core';
import { Logger } from 'angular2-logger/core';
import lodash from 'lodash';

import { BwcService } from './bwc.service';
import { ConfigService } from './config.service';
import { RateService } from './rate.service';

@Injectable()
export class TxFormatService {

  Utils: any;

  constructor(
    public bwcService: BwcService,
    public configService: ConfigService,
    public rateService: RateService
  ) {
    this.Utils = this.bwcService.getUtils();
  }

  formatAmount(satoshis, fullPrecision?) {
    let config = this.configService.getSync().wallet.settings;
    if (config.unitCode == 'sat') return satoshis;

    //TODO : now only works for english, specify opts to change thousand separator and decimal separator
    let opts = {
      fullPrecision: !!fullPrecision
    };
    return this.Utils.formatAmount(satoshis, config.unitCode, opts);
  };

  formatAmountStr(satoshis) {
    if (!satoshis) return;
    let config = this.configService.getSync().wallet.settings;
    return this.formatAmount(satoshis) + ' ' + config.unitName;
  };

  formatToUSD(satoshis, cb) {
    if (!satoshis) return;
    let val = () => {
      let v1 = this.rateService.toFiat(satoshis, 'USD');
      if (!v1) return null;

      return v1.toFixed(2);
    };

    // Async version
    if (cb) {
      this.rateService.whenAvailable(function() {
        return cb(val());
      });
    } else {
      if (!this.rateService.isAvailable()) return null;
      return val();
    };
  };

  formatAlternativeStr(satoshis, cb?) {
    if (!satoshis) return;
    let config = this.configService.getSync().wallet.settings;

    let val = () => {
      let v1 = this.rateService.toFiat(satoshis, config.alternativeIsoCode);
      if (!v1) return null;

      return v1.toFixed(2) + ' ' + config.alternativeIsoCode;
    };

    // Async version
    if (cb) {
      this.rateService.whenAvailable(function() {
        return cb(val());
      });
    } else {
      if (!this.rateService.isAvailable()) return null;
      return val();
    };
  };

  processTx(tx) {
    if (!tx || tx.action == 'invalid')
      return tx;

    // New transaction output format
    if (tx.outputs && tx.outputs.length) {

      let outputsNr = tx.outputs.length;

      if (tx.action != 'received') {
        if (outputsNr > 1) {
          tx.recipientCount = outputsNr;
          tx.hasMultiplesOutputs = true;
        }
        tx.amount = lodash.reduce(tx.outputs, function(total, o) {
          o.amountStr = this.formatAmountStr(o.amount);
          o.alternativeAmountStr = this.formatAlternativeStr(o.amount);
          return total + o.amount;
        }, 0);
      }
      tx.toAddress = tx.outputs[0].toAddress;
    }

    tx.amountStr = this.formatAmountStr(tx.amount);
    tx.alternativeAmountStr = this.formatAlternativeStr(tx.amount);
    tx.feeStr = this.formatAmountStr(tx.fee || tx.fees);

    return tx;
  };
}
