import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../providers/logger/logger';

// Providers
import { AddressBookProvider } from '../../providers/address-book/address-book';
import { ConfigProvider } from '../../providers/config/config';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
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
  private config;
  private blockexplorerUrl: string;

  public wallet;
  public btx;
  public actionList;
  public isShared: boolean;
  public title: string;
  public txNotification;
  public color: string;
  public copayerId: string;
  public txsUnsubscribedForNotifications: boolean;
  public contactName: string;
  public txMemo: string;

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
    private walletProvider: WalletProvider,
    private translate: TranslateService
  ) {}

  ionViewDidLoad() {
    this.config = this.configProvider.get();

    this.txId = this.navParams.data.txid;
    this.title = this.translate.instant('Transaction');
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.color = this.wallet.color;
    this.copayerId = this.wallet.credentials.copayerId;
    this.isShared = this.wallet.credentials.n > 1;
    this.txsUnsubscribedForNotifications = this.config.confirmedTxsNotifications
      ? !this.config.confirmedTxsNotifications.enabled
      : true;

    let defaults = this.configProvider.getDefaults();
    this.blockexplorerUrl =
      this.wallet.coin === 'bch'
        ? defaults.blockExplorerUrl.bch
        : defaults.blockExplorerUrl.btc;

    this.txConfirmNotificationProvider.checkIfEnabled(this.txId).then(res => {
      this.txNotification = {
        value: res
      };
    });

    this.updateTx();
  }

  ionViewWillEnter() {
    this.events.subscribe('bwsEvent', (_, type: string, n) => {
      if (type == 'NewBlock' && n && n.data && n.data.network == 'livenet')
        this.updateTxDebounced({ hideLoading: true });
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe('bwsEvent');
  }

  public readMore(): void {
    let url =
      'https://support.bitpay.com/hc/en-us/articles/115004497783-What-does-the-BitPay-wallet-s-warning-amount-too-low-to-spend-mean-';
    let optIn = true;
    let title = null;
    let message = this.translate.instant('Read more in our support page');
    let okText = this.translate.instant('Open');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  private updateMemo(): void {
    this.walletProvider
      .getTxNote(this.wallet, this.btx.txid)
      .then(note => {
        if (!note || note.body == '') return;
        this.btx.note = note;
      })
      .catch(err => {
        this.logger.warn('Could not fetch transaction note: ' + err);
        return;
      });
  }

  private initActionList(): void {
    this.actionList = [];
    if (
      (this.btx.action != 'sent' && this.btx.action != 'moved') ||
      !this.isShared
    )
      return;

    let actionDescriptions = {
      created: this.translate.instant('Proposal Created'),
      accept: this.translate.instant('Accepted'),
      reject: this.translate.instant('Rejected'),
      broadcasted: this.translate.instant('Broadcasted')
    };

    this.actionList.push({
      type: 'created',
      time: this.btx.createdOn,
      description: actionDescriptions.created,
      by: this.btx.creatorName
    });

    _.each(this.btx.actions, action => {
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
      description: actionDescriptions.broadcasted
    });

    setTimeout(() => {
      this.actionList.reverse();
    }, 10);
  }

  private updateTxDebounced = _.debounce(this.updateTx, 1000);

  private updateTx(opts?): void {
    opts = opts ? opts : {};
    if (!opts.hideLoading) this.onGoingProcess.set('loadingTxInfo');
    this.walletProvider
      .getTx(this.wallet, this.txId)
      .then(tx => {
        if (!opts.hideLoading) this.onGoingProcess.clear();

        this.btx = this.txFormatProvider.processTx(
          this.wallet.coin,
          tx,
          this.walletProvider.useLegacyAddress()
        );
        this.btx.feeFiatStr = this.txFormatProvider.formatAlternativeStr(
          this.wallet.coin,
          tx.fees
        );
        this.btx.feeRateStr =
          ((this.btx.fees / (this.btx.amount + this.btx.fees)) * 100).toFixed(
            2
          ) + '%';

        if (!this.btx.note) {
          this.txMemo = this.btx.message;
        }
        if (this.btx.note && this.btx.note.body) {
          this.txMemo = this.btx.note.body;
        }

        if (this.btx.action != 'invalid') {
          if (this.btx.action == 'sent')
            this.title = this.translate.instant('Sent Funds');
          if (this.btx.action == 'received')
            this.title = this.translate.instant('Received Funds');
          if (this.btx.action == 'moved')
            this.title = this.translate.instant('Moved Funds');
        }

        this.updateMemo();
        this.initActionList();
        this.contact();

        this.walletProvider
          .getLowAmount(this.wallet)
          .then((amount: number) => {
            this.btx.lowAmount = tx.amount < amount;
          })
          .catch(err => {
            this.logger.warn('Error getting low amounts: ' + err);
            return;
          });
      })
      .catch(err => {
        if (!opts.hideLoading) this.onGoingProcess.clear();
        this.logger.warn('Error getting transaction: ' + err);
        this.navCtrl.pop();
        return this.popupProvider.ionicAlert(
          'Error',
          this.translate.instant('Transaction not available at this time')
        );
      });
  }

  public async saveMemoInfo(memo: string): Promise<void> {
    this.btx.note = {
      body: memo
    };
    this.logger.debug('Saving memo');

    let args = {
      txid: this.btx.txid,
      body: memo
    };

    await this.walletProvider
      .editTxNote(this.wallet, args)
      .catch((err: any) => {
        this.logger.debug('Could not save tx comment ' + err);
      });

    this.logger.info('Tx Note edited');
  }

  public viewOnBlockchain(): void {
    let btx = this.btx;
    let url =
      'https://' +
      (this.getShortNetworkName() == 'test' ? 'test-' : '') +
      this.blockexplorerUrl +
      '/tx/' +
      btx.txid;
    let optIn = true;
    let title = null;
    let message = this.translate.instant('View Transaction on Insight');
    let okText = this.translate.instant('Open Insight');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  public getShortNetworkName(): string {
    let n: string = this.wallet.credentials.network;
    return n.substring(0, 4);
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
    this.addressBookProvider
      .get(addr)
      .then(ab => {
        if (ab) {
          let name = _.isObject(ab) ? ab.name : ab;
          this.contactName = name;
        }
      })
      .catch(err => {
        this.logger.warn(err);
      });
  }
}
