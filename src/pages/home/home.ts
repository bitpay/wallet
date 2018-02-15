import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, ModalController, NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// Pages
import { AddPage } from '../add/add';
import { CopayersPage } from '../add/copayers/copayers';
import { AmazonPage } from '../integrations/amazon/amazon';
import { BitPayCardPage } from '../integrations/bitpay-card/bitpay-card';
import { BitPayCardIntroPage } from '../integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';
import { CoinbasePage } from '../integrations/coinbase/coinbase';
import { GlideraPage } from '../integrations/glidera/glidera';
import { MercadoLibrePage } from '../integrations/mercado-libre/mercado-libre';
import { ShapeshiftPage } from '../integrations/shapeshift/shapeshift';
import { TxDetailsPage } from '../tx-details/tx-details';
import { TxpDetailsPage } from '../txp-details/txp-details';
import { WalletDetailsPage } from '../wallet-details/wallet-details';
import { ActivityPage } from './activity/activity';
import { ProposalsPage } from './proposals/proposals';

// Providers
import { AddressBookProvider } from '../../providers/address-book/address-book';
import { AppProvider } from '../../providers/app/app';
import { BitPayCardProvider } from '../../providers/bitpay-card/bitpay-card';
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { ConfigProvider } from '../../providers/config/config';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { FeedbackProvider } from '../../providers/feedback/feedback';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { PlatformProvider } from '../../providers/platform/platform';
import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';
import { PushNotificationsProvider } from '../../providers/push-notifications/push-notifications';
import { ReleaseProvider } from '../../providers/release/release';
import { WalletProvider } from '../../providers/wallet/wallet';

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
  public homeIntegrations: any[];
  public bitpayCardItems: any;

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
    private bitPayCardProvider: BitPayCardProvider,
    private translate: TranslateService
  ) {
    this.cachedBalanceUpdateOn = '';
    this.isNW = this.platformProvider.isNW;
    this.isWindowsPhoneApp = this.platformProvider.isWP;
    this.showReorderBtc = false;
    this.showReorderBch = false;
    this.setWallets();
  }

  public ionViewWillEnter() {
    this.config = this.configProvider.get();

    this.setWallets();

    this.recentTransactionsEnabled = this.config.recentTransactions.enabled;
    if (this.recentTransactionsEnabled) {
      this.getNotifications();
    }

    this.pushNotificationsProvider.init();
    this.homeIntegrations = this.homeIntegrationsProvider.get();
    this.showIntegration = this.config.showIntegration;
    this.homeIntegrations.forEach((integration: any) => {
      integration.show = this.showIntegration[integration.name];
    });
    this.homeIntegrations = _.filter(
      this.homeIntegrations,
      homeIntegrations => {
        return homeIntegrations.show == true;
      }
    );

    this.events.subscribe('bwsEvent', (walletId, type, n) => {
      const wallet = this.profileProvider.getWallet(walletId);
      this.updateWallet(wallet);
      if (this.recentTransactionsEnabled) {
        this.getNotifications();
      }
    });
    this.events.subscribe('Local/TxAction', walletId => {
      this.logger.debug('Got action for wallet ' + walletId);
      const wallet = this.profileProvider.getWallet(walletId);
      this.updateWallet(wallet);
      if (this.recentTransactionsEnabled) {
        this.getNotifications();
      }
    });
    this.events.subscribe('feedback:hide', () => {
      this.showRateCard = false;
    });

    this.bitPayCardProvider.get({}, (err, cards) => {
      this.bitpayCardItems = cards;
    });
  }

  public ionViewDidEnter() {
    if (this.isNW) {
      this.checkUpdate();
    }
    this.checkHomeTip();
    this.checkFeedbackInfo();

    this.addressBookProvider
      .list()
      .then((ab: any) => {
        this.addressbook = ab || {};
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  public ionViewWillLeave() {
    this.events.unsubscribe('feedback:hide');
  }

  public ionViewDidLoad() {
    this.logger.info('ionViewDidLoad HomePage');
    this.updateAllWallets();
  }

  private setWallets(): void {
    this.wallets = this.profileProvider.getWallets();
    this.walletsBtc = this.profileProvider.getWallets({ coin: 'btc' });
    this.walletsBch = this.profileProvider.getWallets({ coin: 'bch' });
  }

  public checkHomeTip(): void {
    this.persistenceProvider.getHomeTipAccepted().then((value: string) => {
      this.homeTip = value == 'accepted' ? false : true;
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
        const feedbackInfo = info;
        //Check if current version is greater than saved version
        const currentVersion = this.releaseProvider.getCurrentAppVersion();
        const savedVersion = feedbackInfo.version;
        const isVersionUpdated = this.feedbackProvider.isVersionUpdated(
          currentVersion,
          savedVersion
        );
        if (!isVersionUpdated) {
          this.initFeedBackInfo();
          return;
        }
        const now = moment().unix();
        const timeExceeded = now - feedbackInfo.time >= 24 * 7 * 60 * 60;
        this.showRateCard = timeExceeded && !feedbackInfo.sent;
      }
    });
  }

  private initFeedBackInfo() {
    const feedbackInfo: any = {};
    feedbackInfo.time = moment().unix();
    feedbackInfo.version = this.releaseProvider.getCurrentAppVersion();
    feedbackInfo.sent = false;
    this.showRateCard = false;
    this.persistenceProvider.setFeedbackInfo(feedbackInfo);
  }

  private updateWallet(wallet: any): void {
    this.logger.debug('Updating wallet:' + wallet.name);
    this.walletProvider
      .getStatus(wallet, {})
      .then((status: any) => {
        wallet.status = status;
        this.updateTxps();
      })
      .catch((err: any) => {
        this.logger.error(err);
      });
  }

  private updateTxps(): void {
    this.profileProvider
      .getTxps({ limit: 3 })
      .then((data: any) => {
        this.txps = data.txps;
        this.txpsN = data.n;
      })
      .catch((err: any) => {
        this.logger.error(err);
      });
  }

  private getNotifications = _.debounce(
    () => {
      this.profileProvider
        .getNotifications({ limit: 3 })
        .then((data: any) => {
          this.notifications = data.notifications;
          this.notificationsN = data.total;
        })
        .catch((err: any) => {
          this.logger.error(err);
        });
    },
    2000,
    {
      leading: true
    }
  );

  private updateAllWallets(): void {
    const wallets: any[] = [];
    let foundMessage = false;

    _.each(this.walletsBtc, wBtc => {
      wallets.push(wBtc);
    });

    _.each(this.walletsBch, wBch => {
      wallets.push(wBch);
    });

    if (_.isEmpty(wallets)) {
      return;
    }

    const i = wallets.length;
    let j = 0;

    const pr = ((wallet, cb) => {
      this.walletProvider
        .getStatus(wallet, {})
        .then((status: any) => {
          wallet.status = status;
          wallet.error = null;

          if (!foundMessage && !_.isEmpty(status.serverMessage)) {
            this.serverMessage = status.serverMessage;
            foundMessage = true;
          }

          this.profileProvider.setLastKnownBalance(
            wallet.id,
            wallet.status.availableBalanceStr
          );
          return cb();
        })
        .catch(err => {
          wallet.error =
            err === 'WALLET_NOT_REGISTERED'
              ? 'Wallet not registered'
              : this.bwcErrorProvider.msg(err);
          this.logger.warn(
            this.bwcErrorProvider.msg(
              err,
              'Error updating status for ' + wallet.name
            )
          );
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
    this.releaseProvider
      .getLatestAppVersion()
      .toPromise()
      .then(version => {
        this.logger.debug('Current app version:', version);
        const result = this.releaseProvider.checkForUpdates(version);
        this.logger.debug('Update available:', result.updateAvailable);
        if (result.updateAvailable) {
          this.newRelease = true;
          this.updateText =
            'There is a new version of ' +
            this.app.info.nameCase +
            ' available';
        }
      })
      .catch(err => {
        this.logger.warn('Error:', err);
      });
  }

  public openServerMessageLink(): void {
    const url = this.serverMessage.link;
    this.externalLinkProvider.open(url);
  }

  public goToAddView(coin?: string): void {
    this.navCtrl.push(AddPage, { coin });
  }

  public goToWalletDetails(wallet: any): void {
    if (this.showReorderBtc || this.showReorderBch) {
      return;
    }
    if (!wallet.isComplete()) {
      this.navCtrl.push(CopayersPage, {
        walletId: wallet.credentials.walletId
      });
      return;
    }
    this.navCtrl.push(WalletDetailsPage, {
      walletId: wallet.credentials.walletId
    });
  }

  public openNotificationModal(n: any) {
    const wallet = this.profileProvider.getWallet(n.walletId);

    if (n.txid) {
      this.navCtrl.push(TxDetailsPage, { walletId: n.walletId, txid: n.txid });
    } else {
      const txp = _.find(this.txps, {
        id: n.txpId
      });
      if (txp) {
        this.openTxpModal(txp);
      } else {
        this.onGoingProcessProvider.set('loadingTxInfo', true);
        this.walletProvider
          .getTxp(wallet, n.txpId)
          .then((txp: any) => {
            const _txp = txp;
            this.onGoingProcessProvider.set('loadingTxInfo', false);
            this.openTxpModal(_txp);
          })
          .catch((err: any) => {
            this.logger.warn('No txp found');
            const title = this.translate.instant('Error');
            const subtitle = this.translate.instant('Transaction not found');
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
    const element = this.walletsBtc[indexes.from];
    this.walletsBtc.splice(indexes.from, 1);
    this.walletsBtc.splice(indexes.to, 0, element);
    _.each(this.walletsBtc, (wallet: any, index: number) => {
      this.profileProvider.setWalletOrder(wallet.id, index);
    });
  }

  public reorderWalletsBch(indexes): void {
    const element = this.walletsBch[indexes.from];
    this.walletsBch.splice(indexes.from, 1);
    this.walletsBch.splice(indexes.to, 0, element);
    _.each(this.walletsBch, (wallet: any, index: number) => {
      this.profileProvider.setWalletOrder(wallet.id, index);
    });
  }

  public goToDownload(): void {
    const url = 'https://github.com/bitpay/copay/releases/latest';
    const optIn = true;
    const title = this.translate.instant('Update Available');
    const message = this.translate.instant(
      'An update to this app is available. For your security, please update to the latest version.'
    );
    const okText = this.translate.instant('View Update');
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

  public openTxpModal(tx: any): void {
    const modal = this.modalCtrl.create(
      TxpDetailsPage,
      { tx },
      { showBackdrop: false, enableBackdropDismiss: false }
    );
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

  public goToCard(cardId): void {
    this.navCtrl.push(BitPayCardPage, { id: cardId });
  }

  public doRefresh(refresher) {
    this.updateAllWallets();
    setTimeout(() => {
      refresher.complete();
    }, 2000);
  }
}
