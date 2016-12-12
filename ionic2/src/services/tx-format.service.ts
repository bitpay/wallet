import { Injectable } from '@angular/core';
import { Logger } from 'angular2-logger/core';
import lodash from 'lodash';

import { BwcService } from './bwc.service';
import { ConfigService } from './config.service';

@Injectable()
export class TxFormatService {

  Utils: any;

  constructor(
    public bwcService: BwcService,
    public configService: ConfigService
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
      let v1 = rateService.toFiat(satoshis, 'USD');
      if (!v1) return null;

      return v1.toFixed(2);
    };

    // Async version
    if (cb) {
      rateService.whenAvailable(function() {
        return cb(val());
      });
    } else {
      if (!rateService.isAvailable()) return null;
      return val();
    };
  };

  formatAlternativeStr(satoshis, cb?) {
    if (!satoshis) return;
    let config = this.configService.getSync().wallet.settings;

    let val = () => {
      let v1 = rateService.toFiat(satoshis, config.alternativeIsoCode);
      if (!v1) return null;

      return v1.toFixed(2) + ' ' + config.alternativeIsoCode;
    };

    // Async version
    if (cb) {
      rateService.whenAvailable(function() {
        return cb(val());
      });
    } else {
      if (!rateService.isAvailable()) return null;
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

  // formatPendingTxps(txps) {
  //   //$scope.pendingTxProposalsCountForUs = 0;
  //   let now = Math.floor(Date.now() / 1000);
  //
  //   /* To test multiple outputs...
  //   let txp = {
  //     message: 'test multi-output',
  //     fee: 1000,
  //     createdOn: new Date() / 1000,
  //     outputs: []
  //   };
  //   function addOutput(n) {
  //     txp.outputs.push({
  //       amount: 600,
  //       toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
  //       message: 'output #' + (Number(n) + 1)
  //     });
  //   };
  //   lodash.times(150, addOutput);
  //   txps.push(txp);
  //   */
  //
  //   lodash.each(txps, function(tx) {
  //
  //     tx = txFormatService.processTx(tx);
  //
  //     // no future transactions...
  //     if (tx.createdOn > now)
  //       tx.createdOn = now;
  //
  //     tx.wallet = profileService.getWallet(tx.walletId);
  //     if (!tx.wallet) {
  //       $log.error("no wallet at txp?");
  //       return;
  //     }
  //
  //     let action = lodash.find(tx.actions, {
  //       copayerId: tx.wallet.copayerId
  //     });
  //
  //     if (!action && tx.status == 'pending') {
  //       tx.pendingForUs = true;
  //     }
  //
  //     if (action && action.type == 'accept') {
  //       tx.statusForUs = 'accepted';
  //     } else if (action && action.type == 'reject') {
  //       tx.statusForUs = 'rejected';
  //     } else {
  //       tx.statusForUs = 'pending';
  //     }
  //
  //     if (!tx.deleteLockTime)
  //       tx.canBeRemoved = true;
  //   });
  //
  //   return txps;
  // };

}
