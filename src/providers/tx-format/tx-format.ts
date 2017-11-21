import { Injectable } from '@angular/core';
import * as _ from "lodash";

@Injectable()
export class TxFormatProvider {

  // TODO: implement configService
  public pendingTxProposalsCountForUs: number

  constructor() {}

  public processTx(coin: string, tx: any): any {
    if (!tx || tx.action == 'invalid')
      return tx;

    // New transaction output format
    if (tx.outputs && tx.outputs.length) {

      var outputsNr = tx.outputs.length;

      if (tx.action != 'received') {
        if (outputsNr > 1) {
          tx.recipientCount = outputsNr;
          tx.hasMultiplesOutputs = true;
        }
        tx.amount = _.reduce(tx.outputs, function (total: any, o: any) {
          o.amountStr = this.formatAmountStr(coin, o.amount);
          o.alternativeAmountStr = this.formatAlternativeStr(coin, o.amount);
          return total + o.amount;
        }, 0);
      }
      tx.toAddress = tx.outputs[0].toAddress;
    }

    if (tx.amountStr) {
      tx.amountValueStr = tx.amountStr.split(' ')[0];
      tx.amountUnitStr = tx.amountStr.split(' ')[1];
    }

    return tx;
  };

  public formatPendingTxps(txps): any {
    this.pendingTxProposalsCountForUs = 0;
    var now = Math.floor(Date.now() / 1000);

    /* To test multiple outputs...
    var txp = {
      message: 'test multi-output',
      fee: 1000,
      createdOn: new Date() / 1000,
      outputs: []
    };
    function addOutput(n) {
      txp.outputs.push({
        amount: 600,
        toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
        message: 'output #' + (Number(n) + 1)
      });
    };
    lodash.times(150, addOutput);
    txps.push(txp);
    */

    _.each(txps, function (tx) {

      // no future transactions...
      if (tx.createdOn > now)
        tx.createdOn = now;

      // TODO: implement profileService.getWallet(tx.walletId)
      //tx.wallet = profileService.getWallet(tx.walletId);
      tx.wallet = {
        coin: "btc",
        copayerId: "asdasdasdasd"
      }
      // hardcoded tx.wallet ^


      if (!tx.wallet) {
        console.log("no wallet at txp?");
        return;
      }

      tx = this.processTx(tx.wallet.coin, tx);

      var action: any = _.find(tx.actions, {
        copayerId: tx.wallet.copayerId
      });

      if (!action && tx.status == 'pending') {
        tx.pendingForUs = true;
      }

      if (action && action.type == 'accept') {
        tx.statusForUs = 'accepted';
      } else if (action && action.type == 'reject') {
        tx.statusForUs = 'rejected';
      } else {
        tx.statusForUs = 'pending';
      }

      if (!tx.deleteLockTime)
        tx.canBeRemoved = true;
    });

    return txps;
  };
}
