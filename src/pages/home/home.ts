import { Component } from '@angular/core';
import { NavController, Events, ModalController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';
import { TranslateService } from '@ngx-translate/core';

// Pages
import { ActivityPage } from './activity/activity';
import { AddPage } from "../add/add";
import { AmazonPage } from '../integrations/amazon/amazon';
import { CopayersPage } from '../add/copayers/copayers';
import { GlideraPage } from '../integrations/glidera/glidera';
import { CoinbasePage } from '../integrations/coinbase/coinbase';
import { MercadoLibrePage } from '../integrations/mercado-libre/mercado-libre';
import { ProposalsPage } from './proposals/proposals';
import { ShapeshiftPage } from '../integrations/shapeshift/shapeshift';
import { TxDetailsPage } from '../tx-details/tx-details';
import { TxpDetailsPage } from '../txp-details/txp-details';
import { WalletDetailsPage } from '../wallet-details/wallet-details';
import { BitPayCardIntroPage } from '../integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';

// Providers
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { ProfileProvider } from '../../providers/profile/profile';
import { ReleaseProvider } from '../../providers/release/release';
import { WalletProvider } from '../../providers/wallet/wallet';
import { ConfigProvider } from '../../providers/config/config';
import { PushNotificationsProvider } from '../../providers/push-notifications/push-notifications';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../providers/popup/popup';
import { AddressBookProvider } from '../../providers/address-book/address-book';
import { AppProvider } from '../../providers/app/app';
import { PlatformProvider } from '../../providers/platform/platform';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { FeedbackProvider } from '../../providers/feedback/feedback';

import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public wallets: any;
  public walletsBtc: any;
  public walletsBch: any;
  public cachedBalanceUpdateOn: string;
  public recentTransactionsEnabled: boolean;
  public txps: any;
  public txpsN: number;
  public notifications: any;
  public notificationsN: number;
  public config: any;
  public serverMessage: any;
  public addressbook: any;
  public newRelease: boolean;
  public updateText: string;
  public homeIntegrations: Array<any>;

  public showRateCard: boolean;
  public homeTip: boolean;
  public showReorderBtc: boolean;
  public showReorderBch: boolean;
  public showIntegration: any;

  private isNW: boolean;
  private isWindowsPhoneApp: boolean;

  constructor(
    private navCtrl: NavController,
    private profileProvider: ProfileProvider,
    private releaseProvider: ReleaseProvider,
    private walletProvider: WalletProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private logger: Logger,
    private events: Events,
    private configProvider: ConfigProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private popupProvider: PopupProvider,
    private modalCtrl: ModalController,
    private addressBookProvider: AddressBookProvider,
    private app: AppProvider,
    private platformProvider: PlatformProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private persistenceProvider: PersistenceProvider,
    private feedbackProvider: FeedbackProvider,
    private translate: TranslateService
  ) {
    this.cachedBalanceUpdateOn = '';
    this.isNW = this.platformProvider.isNW;
    this.isWindowsPhoneApp = this.platformProvider.isWP;
    this.showReorderBtc = false;
    this.showReorderBch = false;
  }

  ionViewWillEnter() {
    this.config = this.configProvider.get();
    this.wallets = this.profileProvider.getWallets();
    this.walletsBtc = this.profileProvider.getWallets({ coin: 'btc' });
    this.walletsBch = this.profileProvider.getWallets({ coin: 'bch' });

    this.recentTransactionsEnabled = this.config.recentTransactions.enabled;
    if (this.recentTransactionsEnabled) this.getNotifications();

    this.pushNotificationsProvider.init();
    this.homeIntegrations = this.homeIntegrationsProvider.get();
    this.showIntegration = this.config.showIntegration;
    this.homeIntegrations.forEach((integration: any) => {
      integration.show = this.showIntegration[integration.name];
    });
    this.homeIntegrations = _.filter(this.homeIntegrations, (homeIntegrations) => {
      return homeIntegrations.show == true;
    });

    this.events.subscribe('bwsEvent', (walletId, type, n) => {
      let wallet = this.profileProvider.getWallet(walletId);
      this.updateWallet(wallet);
      if (this.recentTransactionsEnabled) this.getNotifications();
    });
    this.events.subscribe('Local/TxAction', (walletId) => {
      this.logger.debug('Got action for wallet ' + walletId);
      var wallet = this.profileProvider.getWallet(walletId);
      this.updateWallet(wallet);
      if (this.recentTransactionsEnabled) this.getNotifications();
    });
    this.events.subscribe('feedback:hide', () => {
      this.showRateCard = false;
    });
  }

  ionViewDidEnter() {
    if (this.isNW) this.checkUpdate();
    this.checkHomeTip();
    this.checkFeedbackInfo();

    this.addressBookProvider.list().then((ab: any) => {
      this.addressbook = ab || {};
    }).catch((err) => {
      this.logger.error(err);
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe('bwsEvent');
    this.events.unsubscribe('Local/TxAction');
    this.events.unsubscribe('feedback:hide');
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad HomePage');
    this.updateAllWallets();
  }

  public checkHomeTip(): void {
    this.persistenceProvider.getHomeTipAccepted().then((value: string) => {
      this.homeTip = (value == 'accepted') ? false : true;
    });
  }

  public hideHomeTip(): void {
    this.persistenceProvider.setHomeTipAccepted('accepted');
    this.homeTip = false;
  }

  private checkFeedbackInfo() {
    this.persistenceProvider.getFeedbackInfo().then((info: any) => {
      if (this.isWindowsPhoneApp) {
        this.showRateCard = false;
        return;
      }
      if (!info) {
        this.initFeedBackInfo();
      } else {
        let feedbackInfo = info;
        //Check if current version is greater than saved version
        let currentVersion = this.releaseProvider.getCurrentAppVersion();
        let savedVersion = feedbackInfo.version;
        let isVersionUpdated = this.feedbackProvider.isVersionUpdated(currentVersion, savedVersion);
        if (!isVersionUpdated) {
          this.initFeedBackInfo();
          return;
        }
        let now = moment().unix();
        let timeExceeded = (now - feedbackInfo.time) >= 24 * 7 * 60 * 60;
        this.showRateCard = timeExceeded && !feedbackInfo.sent;
      }
    });
  }

  private initFeedBackInfo() {
    let feedbackInfo: any = {};
    feedbackInfo.time = moment().unix();
    feedbackInfo.version = this.releaseProvider.getCurrentAppVersion();
    feedbackInfo.sent = false;
    this.showRateCard = false;
    this.persistenceProvider.setFeedbackInfo(feedbackInfo);
  }

  private updateWallet(wallet: any): void {
    this.logger.debug('Updating wallet:' + wallet.name)
    this.walletProvider.getStatus(wallet, {}).then((status: any) => {
      wallet.status = status;
      this.updateTxps();
    }).catch((err: any) => {
      this.logger.error(err);
    });
  }

  private updateTxps(): void {
    this.profileProvider.getTxps({ limit: 3 }).then((data: any) => {
      this.txps = data.txps;
      this.txpsN = data.n;
    }).catch((err: any) => {
      this.logger.error(err);
    });
  }

  private getNotifications = _.debounce(() => {
    this.profileProvider.getNotifications({ limit: 3 }).then((data: any) => {
      this.notifications = data.notifications;
      this.notificationsN = data.total;
    }).catch((err: any) => {
      this.logger.error(err);
    });
  }, 2000, {
      'leading': true
    });

  private updateAllWallets(): void {
    let wallets: Array<any> = [];
    let foundMessage = false

    _.each(this.walletsBtc, (wBtc) => {
      wallets.push(wBtc);
    });

    _.each(this.walletsBch, (wBch) => {
      wallets.push(wBch);
    });

    if (_.isEmpty(wallets)) return;

    let i = wallets.length;
    let j = 0;

    let pr = ((wallet, cb) => {
      this.walletProvider.getStatus(wallet, {}).then((status: any) => {
        wallet.status = status;
        wallet.error = null;

        if (!foundMessage && !_.isEmpty(status.serverMessage)) {
          this.serverMessage = status.serverMessage;
          foundMessage = true;
        }

        this.profileProvider.setLastKnownBalance(wallet.id, wallet.status.availableBalanceStr);
        return cb();
      }).catch((err) => {
        wallet.error = (err === 'WALLET_NOT_REGISTERED') ? 'Wallet not registered' : this.bwcErrorProvider.msg(err);
        this.logger.warn(this.bwcErrorProvider.msg(err, 'Error updating status for ' + wallet.name));
        return cb();
      });
    }).bind(this);

    _.each(wallets, (wallet: any) => {
      pr(wallet, () => {
        if (++j == i) {
          this.updateTxps();
        }
      });
    });
  }

  private checkUpdate(): void {
    //TODO check if new update
    this.releaseProvider.getLatestAppVersion()
      .then((version) => {
        this.logger.debug('Current app version:', version);
        var result = this.releaseProvider.checkForUpdates(version);
        this.logger.debug('Update available:', result.updateAvailable);
        if (result.updateAvailable) {
          this.newRelease = true;
          this.updateText = 'There is a new version of ' + this.app.info.nameCase + ' available';
        }
      })
      .catch((err) => {
        this.logger.warn('Error:', err);
      })
  }

  public openServerMessageLink(): void {
    let url = this.serverMessage.link;
    this.externalLinkProvider.open(url);
  }

  public goToAddView(coin?: string): void {
    this.navCtrl.push(AddPage, { coin: coin });
  }

  public goToWalletDetails(wallet: any): void {
    if (this.showReorderBtc || this.showReorderBch) return;
    if (!wallet.isComplete()) {
      this.navCtrl.push(CopayersPage, { walletId: wallet.credentials.walletId });
      return;
    }
    this.navCtrl.push(WalletDetailsPage, { walletId: wallet.credentials.walletId });
  }

  public openNotificationModal(n: any) {
    let wallet = this.profileProvider.getWallet(n.walletId);

    if (n.txid) {
      this.navCtrl.push(TxDetailsPage, { walletId: n.walletId, txid: n.txid });
    } else {
      var txp = _.find(this.txps, {
        id: n.txpId
      });
      if (txp) {
        this.openTxpModal(txp);
      } else {
        this.onGoingProcessProvider.set('loadingTxInfo', true);
        this.walletProvider.getTxp(wallet, n.txpId).then((txp: any) => {
          var _txp = txp;
          this.onGoingProcessProvider.set('loadingTxInfo', false);
          this.openTxpModal(_txp);
        }).catch((err: any) => {
          this.logger.warn('No txp found');
          let title = this.translate.instant('Error');
          let subtitle = this.translate.instant('Transaction not found');
          return this.popupProvider.ionicAlert(title, subtitle);
        });
      }
    }
  }

  public reorderBtc(): void {
    this.showReorderBtc = !this.showReorderBtc;
  }

  public reorderBch(): void {
    this.showReorderBch = !this.showReorderBch;
  }

  public reorderWalletsBtc(indexes): void {
    let element = this.walletsBtc[indexes.from];
    this.walletsBtc.splice(indexes.from, 1);
    this.walletsBtc.splice(indexes.to, 0, element);
    _.each(this.walletsBtc, (wallet: any, index: number) => {
      this.profileProvider.setWalletOrder(wallet.id, index);
    });
  };

  public reorderWalletsBch(indexes): void {
    let element = this.walletsBch[indexes.from];
    this.walletsBch.splice(indexes.from, 1);
    this.walletsBch.splice(indexes.to, 0, element);
    _.each(this.walletsBch, (wallet: any, index: number) => {
      this.profileProvider.setWalletOrder(wallet.id, index);
    });
  };

  public goToDownload(): void {
    let url = 'https://github.com/bitpay/copay/releases/latest';
    let optIn = true;
    let title = this.translate.instant('Update Available');
    let message = this.translate.instant('An update to this app is available. For your security, please update to the latest version.');
    let okText = this.translate.instant('View Update');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }

  public openTxpModal(tx: any): void {
    let modal = this.modalCtrl.create(TxpDetailsPage, { tx: tx }, { showBackdrop: false, enableBackdropDismiss: false });
    modal.present();
  }

  public openProposalsPage(): void {
    this.navCtrl.push(ProposalsPage);
  }

  public openActivityPage(): void {
    this.navCtrl.push(ActivityPage);
  }

  public goTo(page): void {
    switch (page) {
      case 'AmazonPage':
        this.navCtrl.push(AmazonPage);
        break;
      case 'BitPayCardIntroPage':
        this.navCtrl.push(BitPayCardIntroPage);
        break;
      case 'CoinbasePage':
        this.navCtrl.push(CoinbasePage);
        break;
      case 'GlideraPage':
        this.navCtrl.push(GlideraPage);
        break;
      case 'MercadoLibrePage':
        this.navCtrl.push(MercadoLibrePage);
        break;
      case 'ShapeshiftPage':
        this.navCtrl.push(ShapeshiftPage);
        break;
    }
  }

  public doRefresh(refresher) {
    this.updateAllWallets();
    setTimeout(() => {
      refresher.complete();
    }, 2000);
  }
}
