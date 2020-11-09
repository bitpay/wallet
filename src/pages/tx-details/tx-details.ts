import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  NavController,
  NavParams,
  ViewController
} from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../providers/logger/logger';

// Providers
import { AddressBookProvider } from '../../providers/address-book/address-book';
import { ConfigProvider } from '../../providers/config/config';
import { CurrencyProvider } from '../../providers/currency/currency';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { FilterProvider } from '../../providers/filter/filter';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';
import { RateProvider } from '../../providers/rate/rate';
import { TxConfirmNotificationProvider } from '../../providers/tx-confirm-notification/tx-confirm-notification';
import { TxFormatProvider } from '../../providers/tx-format/tx-format';
import { WalletProvider } from '../../providers/wallet/wallet';

@Component({
  selector: 'page-tx-details',
  templateUrl: 'tx-details.html'
})
export class TxDetailsModal {
  private txId: string;
  private config;
  private blockexplorerUrl: string;
  private blockexplorerUrlTestnet: string;

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
    private currencyProvider: CurrencyProvider,
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
    private translate: TranslateService,
    private filter: FilterProvider,
    private rateProvider: RateProvider,
    private viewCtrl: ViewController
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
    this.blockexplorerUrl = defaults.blockExplorerUrl[this.wallet.coin];
    this.blockexplorerUrlTestnet =
      defaults.blockExplorerUrlTestnet[this.wallet.coin];

    this.txConfirmNotificationProvider.checkIfEnabled(this.txId).then(res => {
      this.txNotification = {
        value: res
      };
    });

    this.updateTx();
  }

  ionViewWillLoad() {
    this.events.subscribe('bwsEvent', this.bwsEventHandler);
  }

  ionViewWillUnload() {
    this.events.unsubscribe('bwsEvent', this.bwsEventHandler);
  }

  private bwsEventHandler: any = (_, type: string, n) => {
    let match = false;
    if (
      type == 'NewBlock' &&
      n &&
      n.data &&
      this.wallet &&
      n.data &&
      n.data.network == this.wallet.network &&
      n.data.coin == this.wallet.coin
    ) {
      match = true;
      this.updateTxDebounced({ hideLoading: true });
    }
    this.logger.debug('bwsEvent handler @tx-details. Matched: ' + match);
  };

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
      failed: this.translate.instant('Execution Failed'),
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

  private updateTxDebounced = _.debounce(
    async hideLoading => {
      this.updateTx({ hideLoading });
    },
    1000,
    {
      leading: true
    }
  );

  private updateTx(opts?): void {
    opts = opts ? opts : {};
    if (!opts.hideLoading) this.onGoingProcess.set('loadingTxInfo');
    this.walletProvider
      .getTx(this.wallet, this.txId)
      .then(tx => {
        if (!opts.hideLoading) this.onGoingProcess.clear();

        this.btx = this.txFormatProvider.processTx(this.wallet.coin, tx);
        this.btx.network = this.wallet.credentials.network;
        this.btx.coin = this.wallet.coin;
        const chain = this.currencyProvider
          .getChain(this.wallet.coin)
          .toLowerCase();
        this.btx.feeFiatStr = this.txFormatProvider.formatAlternativeStr(
          chain,
          tx.fees
        );

        if (this.currencyProvider.isUtxoCoin(this.wallet.coin)) {
          this.btx.feeRateStr =
            ((this.btx.fees / (this.btx.amount + this.btx.fees)) * 100).toFixed(
              2
            ) + '%';
        }

        if (!this.btx.note) {
          this.txMemo = this.btx.message;
        }
        if (this.btx.note && this.btx.note.body) {
          this.txMemo = this.btx.note.body;
        }

        if (this.btx.action != 'invalid') {
          if (this.btx.action == 'sent')
            this.title = this.translate.instant('Sent');
          if (this.btx.action == 'received')
            this.title = this.translate.instant('Received');
          if (this.btx.action == 'moved')
            this.title = this.translate.instant('Sent to self');
        }

        this.updateMemo();
        this.initActionList();
        this.contact();

        this.updateFiatRate();

        if (this.currencyProvider.isUtxoCoin(this.wallet.coin)) {
          this.walletProvider
            .getLowAmount(this.wallet)
            .then((amount: number) => {
              this.btx.lowAmount = tx.amount < amount;
            })
            .catch(err => {
              this.logger.warn('Error getting low amounts: ' + err);
              return;
            });
        }
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

  public async saveMemoInfo(): Promise<void> {
    this.logger.info('Saving memo: ', this.txMemo);
    this.btx.note = {
      body: this.txMemo
    };
    let args = {
      txid: this.btx.txid,
      body: this.txMemo
    };

    await this.walletProvider
      .editTxNote(this.wallet, args)
      .catch((err: any) => {
        this.logger.error('Could not save tx comment ' + err);
      });

    this.logger.info('Tx Note edited');
  }

  public viewOnBlockchain(): void {
    let btx = this.btx;
    const url =
      this.wallet.credentials.network === 'livenet'
        ? `https://${this.blockexplorerUrl}tx/${btx.txid}`
        : `https://${this.blockexplorerUrlTestnet}tx/${btx.txid}`;
    let optIn = true;
    let title = null;
    let message = this.translate.instant('View Transaction');
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

  public openExternalLink(url: string): void {
    const optIn = true;
    const title = null;
    const message = this.translate.instant(
      'Help and support information is available at the website.'
    );
    const okText = this.translate.instant('Open');
    const cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  private updateFiatRate() {
    const settings = this.configProvider.get().wallet.settings;
    this.rateProvider
      .getHistoricFiatRate(
        settings.alternativeIsoCode,
        this.wallet.coin,
        (this.btx.time * 1000).toString()
      )
      .then(fiat => {
        if (fiat && fiat.rate) {
          this.btx.fiatRateStr =
            this.filter.formatFiatAmount(
              parseFloat((fiat.rate * this.btx.amountValueStr).toFixed(2))
            ) +
            ' ' +
            settings.alternativeIsoCode +
            ' @ ' +
            this.filter.formatFiatAmount(fiat.rate) +
            ` ${settings.alternativeIsoCode} per ` +
            this.wallet.coin.toUpperCase();
        } else {
          this.btx.fiatRateStr = this.btx.alternativeAmountStr;
        }
      });
  }

  close() {
    this.viewCtrl.dismiss();
  }
}
