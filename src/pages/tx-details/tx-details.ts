import { Component } from "@angular/core";
import { NavController, NavParams, Events } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from "lodash";

// Providers
import { AddressBookProvider } from '../../providers/address-book/address-book';
import { ConfigProvider } from '../../providers/config/config';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { OnGoingProcessProvider } from "../../providers/on-going-process/on-going-process";
import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';
import { TxConfirmNotificationProvider } from '../../providers/tx-confirm-notification/tx-confirm-notification';
import { TxFormatProvider } from '../../providers/tx-format/tx-format';
import { WalletProvider } from '../../providers/wallet/wallet';

@Component({
  selector: 'page-tx-details',
  templateUrl: 'tx-details.html'
})
export class TxDetailsPage {
  private txId: string;
  private config: any;
  private blockexplorerUrl: string;

  public wallet: any;
  public btx: any;
  public actionList: Array<any>;
  public isShared: boolean;
  public title: string;
  public alternativeIsoCode: string;
  public rateDate: any;
  public rate: any;
  public txNotification: any;
  public color: string;
  public copayerId: string;
  public txsUnsubscribedForNotifications: boolean;
  public toName: string;

  constructor(
    private addressBookProvider: AddressBookProvider,
    private configProvider: ConfigProvider,
    private events: Events,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private navCtrl: NavController,
    private navParams: NavParams,
    private onGoingProcess: OnGoingProcessProvider,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider,
    private txConfirmNotificationProvider: TxConfirmNotificationProvider,
    private txFormatProvider: TxFormatProvider,
    private walletProvider: WalletProvider
  ) {
    this.config = this.configProvider.get();

    this.txId = this.navParams.data.txid;
    this.title = 'Transaction'; // Todo: gettextCatalog
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.color = this.wallet.color;
    this.copayerId = this.wallet.credentials.copayerId;
    this.isShared = this.wallet.credentials.n > 1;
    this.txsUnsubscribedForNotifications = this.config.confirmedTxsNotifications ? !this.config.confirmedTxsNotifications.enabled : true;

    if (this.wallet.coin == 'bch') {
      if (this.walletProvider.useLegacyAddress()) {
        this.blockexplorerUrl = 'bch-insight.bitpay.com';
      } else {
        this.blockexplorerUrl = 'blockdozer.com/insight';
      }
    } else {
      this.blockexplorerUrl = 'insight.bitpay.com';
    }

    this.txConfirmNotificationProvider.checkIfEnabled(this.txId).then((res: any) => {
      this.txNotification = {
        value: res
      };
    });

    this.updateTx();
  }

  ionViewWillEnter() {
    this.events.subscribe('bwsEvent', (walletId: string, type: string, n: any) => {
      if (type == 'NewBlock' && n && n.data && n.data.network == 'livenet') this.updateTxDebounced({ hideLoading: true });
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe('bwsEvent');
  }

  public readMore(): void {
    let url = 'https://github.com/bitpay/copay/wiki/COPAY---FAQ#amount-too-low-to-spend';
    let optIn = true;
    let title = null;
    let message = 'Read more in our Wiki'; // Todo: gettextCatalog
    let okText = 'Open'; // Todo: gettextCatalog
    let cancelText = 'Go Back'; // Todo: gettextCatalog
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }

  private updateMemo(): void {
    this.walletProvider.getTxNote(this.wallet, this.btx.txid).then((note: string) => {
      if (!note) return;
      this.btx.note = note;
    }).catch((err: any) => {
      this.logger.warn('Could not fetch transaction note: ' + err);
      return;
    });
  }

  private initActionList(): void {
    this.actionList = [];
    if (this.btx.action != 'sent' && this.btx.action != 'moved' || !this.isShared) return;

    let actionDescriptions = {
      created: 'Proposal Created', // Todo: gettextCatalog
      accept: 'Accepted', // Todo: gettextCatalog
      reject: 'Rejected', // Todo: gettextCatalog
      broadcasted: 'Broadcasted' // Todo: gettextCatalog
    };

    this.actionList.push({
      type: 'created',
      time: this.btx.createdOn,
      description: actionDescriptions.created,
      by: this.btx.creatorName
    });

    _.each(this.btx.actions, (action: any) => {
      this.actionList.push({
        type: action.type,
        time: action.createdOn,
        description: actionDescriptions[action.type],
        by: action.copayerName
      });
    });

    this.actionList.push({
      type: 'broadcasted',
      time: this.btx.time,
      description: actionDescriptions.broadcasted,
    });

    setTimeout(() => {
      this.actionList.reverse();
    }, 10);
  }

  private updateTxDebounced = _.debounce(this.updateTx, 1000);

  private updateTx(opts?: any): void {
    opts = opts ? opts : {};
    if (!opts.hideLoading) this.onGoingProcess.set('loadingTxInfo', true);
    this.walletProvider.getTx(this.wallet, this.txId).then((tx: any) => {
      if (!opts.hideLoading) this.onGoingProcess.set('loadingTxInfo', false);

      this.btx = this.txFormatProvider.processTx(this.wallet.coin, tx, this.walletProvider.useLegacyAddress());
      let v: string = this.txFormatProvider.formatAlternativeStr(this.wallet.coin, tx.fees);
      this.btx.feeFiatStr = v;
      this.btx.feeRateStr = (this.btx.fees / (this.btx.amount + this.btx.fees) * 100).toFixed(2) + '%';

      if (this.btx.action != 'invalid') {
        if (this.btx.action == 'sent') this.title = 'Sent Funds'; // Todo: gettextCatalog
        if (this.btx.action == 'received') this.title = 'Received Funds'; // Todo: gettextCatalog
        if (this.btx.action == 'moved') this.title = 'Moved Funds'; // Todo: gettextCatalog
      }

      this.updateMemo();
      this.initActionList();
      this.getFiatRate();
      this.contact();

      this.walletProvider.getLowAmount(this.wallet).then((amount: number) => {
        this.btx.lowAmount = tx.amount < amount;
      }).catch((err: any) => {
        this.logger.warn('Error getting low amounts: ' + err);
        return;
      });
    }).catch((err: any) => {
      if (!opts.hideLoading) this.onGoingProcess.set('loadingTxInfo', false);
      this.logger.warn('Error getting transaction: ' + err);
      this.navCtrl.pop();
      return this.popupProvider.ionicAlert('Error', 'Transaction not available at this time'); // Todo: gettextCatalog
    });
  }

  public showCommentPopup(): void {
    let opts: any = {};
    if (this.btx.message) {
      opts.defaultText = this.btx.message;
    }
    if (this.btx.note && this.btx.note.body) opts.defaultText = this.btx.note.body;

    this.popupProvider.ionicPrompt(this.wallet.name, 'Memo', opts).then((text: string) => { // Todo: gettextCatalog
      if (typeof text == "undefined") return;

      this.btx.note = {
        body: text
      };
      this.logger.debug('Saving memo');

      let args = {
        txid: this.btx.txid,
        body: text
      };

      this.walletProvider.editTxNote(this.wallet, args).then((res: any) => {
        this.logger.info('Tx Note edited: ', res);
      }).catch((err: any) => {
        this.logger.debug('Could not save tx comment ' + err);
      });
    });
  }

  public viewOnBlockchain(): void {
    let btx = this.btx;
    let url = 'https://' + (this.getShortNetworkName() == 'test' ? 'test-' : '') + this.blockexplorerUrl + '/tx/' + btx.txid;
    let optIn = true;
    let title = null;
    let message = 'View Transaction on Insight'; // Todo: gettextCatalog
    let okText = 'Open Insight'; // Todo: gettextCatalog
    let cancelText = 'Go Back'; // Todo: gettextCatalog
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }

  public getShortNetworkName(): string {
    let n: string = this.wallet.credentials.network;
    return n.substring(0, 4);
  }

  private getFiatRate(): void {
    this.alternativeIsoCode = this.wallet.status.alternativeIsoCode;
    this.wallet.getFiatRate({
      code: this.alternativeIsoCode,
      ts: this.btx.time * 1000
    }, (err, res) => {
      if (err) {
        this.logger.debug('Could not get historic rate');
        return;
      }
      if (res && res.rate) {
        this.rateDate = res.fetchedOn;
        this.rate = res.rate;
      }
    });
  }

  public txConfirmNotificationChange(): void {
    if (this.txNotification.value) {
      this.txConfirmNotificationProvider.subscribe(this.wallet, {
        txid: this.txId
      });
    } else {
      this.txConfirmNotificationProvider.unsubscribe(this.wallet, this.txId);
    }
  }

  private contact(): void {
    let addr = this.btx.addressTo;
    this.addressBookProvider.get(addr).then((ab: any) => {
      if (ab) {
        let name = _.isObject(ab) ? ab.name : ab;
        this.toName = name;
      } else {
        this.toName = addr;
      }
    }).catch((err: any) => {
      this.logger.warn(err);
    });
  }

}
