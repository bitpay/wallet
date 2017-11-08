import { Component } from "@angular/core";
import { NavParams } from 'ionic-angular';
import { TxFormatProvider } from '../../providers/tx-format/tx-format';

@Component({
  selector: 'page-tx-details',
  templateUrl: 'tx-details.html'
})
export class TxDetailsPage {
  public title: string;
  public tx: any;
  public fiatAmountStr: string;
  
  constructor(
    private navParams: NavParams,
    private txFormatProvider: TxFormatProvider,
  ) {
    this.tx = this.navParams.data.tx;
    this.fiatAmountStr = this.txFormatProvider.formatAlternativeStr('btc', this.tx.amount);
  }

  ionViewDidEnter() {
    if (this.tx.action == 'sent') this.title = 'Sent Funds';
    if (this.tx.action == 'received') this.title = 'Received Funds';
    if (this.tx.action == 'moved') this.title = 'Moved Funds';
  }

  addMemo() {
    return;
  }

  viewOnBlockchain() {
    return;
  }
}