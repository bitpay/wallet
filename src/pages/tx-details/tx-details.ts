import { Component } from "@angular/core";
import { NavParams } from 'ionic-angular';
import { TxFormatProvider } from '../../providers/tx-format/tx-format';
import { WalletProvider } from '../../providers/wallet/wallet';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';

@Component({
  selector: 'page-tx-details',
  templateUrl: 'tx-details.html'
})
export class TxDetailsPage {
  public title: string;
  public tx: any;
  public destinationAddress: string;

  private wallet: any;
  
  constructor(
    private navParams: NavParams,
    private txFormatProvider: TxFormatProvider,
    private walletProvider: WalletProvider,
    private externalLinkProvider: ExternalLinkProvider,
  ) {
    this.wallet = this.navParams.data.wallet;
    this.tx = this.navParams.data.tx;
  }

  ionViewDidEnter() {
    if (this.tx.action == 'sent') this.title = 'Sent Funds';
    if (this.tx.action == 'received') this.title = 'Received Funds';
    if (this.tx.action == 'moved') this.title = 'Moved Funds';

    this.walletProvider.getTx(this.wallet, this.tx.txid).then((tx) => {
      this.updateTxParams(tx);
    }).catch((err) => {
      console.log('ERROR', err);
    });
  }

  private updateTxParams(tx: any) {
    this.tx = tx;
    this.destinationAddress = tx.addressTo;
  }

  addMemo() {
    return;
  }

  viewOnBlockchain() {
    const url = 'https://insight.bitpay.com/tx/' + this.tx.txid;
    this.externalLinkProvider.open(url);
  }
}