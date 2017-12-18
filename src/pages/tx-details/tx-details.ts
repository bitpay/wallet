import { Component } from "@angular/core";
import { NavParams } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

// Providers
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { OnGoingProcessProvider } from "../../providers/on-going-process/on-going-process";
import { ProfileProvider } from '../../providers/profile/profile';
import { WalletProvider } from '../../providers/wallet/wallet';
import { PopupProvider } from '../../providers/popup/popup';

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
    private logger: Logger,
    private popupProvider: PopupProvider
  ) {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.tx = {};
    this.confirmations = null;
  }

  ionViewDidLoad() {
    const txid = this.navParams.data.txid;

    this.onGoingProcess.set('loadingTxInfo', true);
    this.walletProvider.getTx(this.wallet, txid).then((tx) => {
      this.onGoingProcess.set('loadingTxInfo', false);
      this.tx = tx;
      if (this.tx.action == 'sent') this.title = 'Sent Funds';
      if (this.tx.action == 'received') this.title = 'Received Funds';
      if (this.tx.action == 'moved') this.title = 'Moved Funds';

      if (this.tx.safeConfirmed) this.confirmations = this.tx.safeConfirmed;
      else if (this.tx.confirmations > 6) this.confirmations = '6+';

      this.updateMemo();
    }).catch((err) => {
      this.logger.warn(err);
    });
  }

  updateMemo() {
    this.walletProvider.getTxNote(this.wallet, this.tx.txid).then((note) => {
      if (!note) return;
      this.tx.message = note.body;
    }).catch((err) => {
      this.logger.warn('Could not fetch transaction note: ' + err);
    });
  }

  addMemo() {
    let message = 'Add message'; // TODO gettextCatalog
    let opts = {
      defaultText: this.tx.message
    };
    this.popupProvider.ionicPrompt(null, message, opts).then((res: string) => {
      if (res) {
        this.tx.message = res;
        let args = {
          txid: this.tx.txid,
          body: res
        };

        this.walletProvider.editTxNote(this.wallet, args).catch((err) => {
          this.logger.warn(err);
        });
      }
    });
  }

  viewOnBlockchain() {
    const prefix = this.wallet.coin === 'bch' ? 'bch-' : this.wallet.network === 'testnet' ? 'test-' : '';
    const url = 'https://' + prefix + 'insight.bitpay.com/tx/' + this.tx.txid;
    this.externalLinkProvider.open(url);
  }
}
