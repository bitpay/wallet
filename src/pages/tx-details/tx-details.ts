import { Component } from "@angular/core";
import { NavParams } from 'ionic-angular';

// Providers
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { OnGoingProcessProvider } from "../../providers/on-going-process/on-going-process";
import { ProfileProvider } from '../../providers/profile/profile';
import { WalletProvider } from '../../providers/wallet/wallet';

@Component({
  selector: 'page-tx-details',
  templateUrl: 'tx-details.html'
})
export class TxDetailsPage {
  public title: string;
  public wallet: any;
  public tx: any;
  public confirmations: string;

  constructor(
    private navParams: NavParams,
    private walletProvider: WalletProvider,
    private profileProvider: ProfileProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private onGoingProcess: OnGoingProcessProvider,
  ) {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.tx = {};
    this.confirmations = null;
  }

  ionViewDidLoad() {
    const txid = this.navParams.data.txid;

    this.onGoingProcess.set('loadingTx', true);
    this.walletProvider.getTx(this.wallet, txid).then((tx) => {
      this.onGoingProcess.set('loadingTx', false);
      this.tx = tx;
      if (this.tx.action == 'sent') this.title = 'Sent Funds';
      if (this.tx.action == 'received') this.title = 'Received Funds';
      if (this.tx.action == 'moved') this.title = 'Moved Funds';

      if (this.tx.safeConfirmed) this.confirmations = this.tx.safeConfirmed;
      else if (this.tx.confirmations > 6) this.confirmations = '6+';
    }).catch((err) => {
      console.log(err);
    });
  }

  addMemo() {
    return;
  }

  viewOnBlockchain() {
    const prefix = this.wallet.coin === 'bch' ? 'bch-' : this.wallet.network === 'testnet' ? 'test-' : '';
    const url = 'https://' + prefix + 'insight.bitpay.com/tx/' + this.tx.txid;
    this.externalLinkProvider.open(url);
  }
}
