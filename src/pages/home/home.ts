import { Component, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  Platform
} from 'ionic-angular';
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
import { IncomingDataProvider } from '../../providers/incoming-data/incoming-data';
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
  @ViewChild('showCard') showCard;
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
  public showBitPayCard: boolean = false;

  public showRateCard: boolean;
  public homeTip: boolean;
  public showReorderBtc: boolean;
  public showReorderBch: boolean;
  public showIntegration: any;

  private isNW: boolean;
  private updatingWalletId: object;
  private zone: any;

  constructor(
    private plt: Platform,
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
    private appProvider: AppProvider,
    private platformProvider: PlatformProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private persistenceProvider: PersistenceProvider,
    private feedbackProvider: FeedbackProvider,
    private bitPayCardProvider: BitPayCardProvider,
    private translate: TranslateService,
    private incomingDataProvider: IncomingDataProvider
  ) {
    this.updatingWalletId = {};
    this.addressbook = {};
    this.cachedBalanceUpdateOn = '';
    this.isNW = this.platformProvider.isNW;
    this.showReorderBtc = false;
    this.showReorderBch = false;
    this.zone = new NgZone({ enableLongStackTrace: false });

    if (this.platformProvider.isCordova) {
      this.handleDeepLinks();
    }

    if (this.platformProvider.isNW) {
      this.handleDeepLinksNW();
    }

    this.listenForEvents();
  }

  ionViewWillEnter() {
    this.config = this.configProvider.get();
    this.pushNotificationsProvider.init();

    this.addressBookProvider
      .list()
      .then((ab: any) => {
        this.addressbook = ab || {};
      })
      .catch(err => {
        this.logger.error(err);
      });

    // Update Tx Notifications
    this.recentTransactionsEnabled = this.config.recentTransactions.enabled;
    if (this.recentTransactionsEnabled) this.getNotifications();

    // Update Tx Proposals
    this.updateTxps();

    // Update list of wallets and status
    this.setWallets();

  }

  ionViewDidEnter() {
    if (this.isNW) this.checkUpdate();
    this.checkHomeTip();
    this.checkFeedbackInfo();

    // Show integrations
    let integrations = _.filter(this.homeIntegrationsProvider.get(), {
      show: true
    });

    // Hide BitPay if linked
    setTimeout(() => {
      this.homeIntegrations = _.remove(_.clone(integrations), x => {
        if (x.name == 'debitcard' && x.linked) return;
        else return x;
      });
    }, 200);

    // Only BitPay Wallet
    this.bitPayCardProvider.get({}, (err, cards) => {
      this.zone.run(() => {
        this.showBitPayCard = this.appProvider.info._enabledExtensions.debitcard
          ? true
          : false;
        this.bitpayCardItems = cards;
      });
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe('feedback:hide');
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad HomePage');

    this.plt.resume.subscribe(e => {
      this.updateTxps();
      this.setWallets();
    });
  }

  private listenForEvents() {
    // BWS Events: Update Status per Wallet
    // NewBlock, NewCopayer, NewAddress, NewTxProposal, TxProposalAcceptedBy, TxProposalRejectedBy, txProposalFinallyRejected,
    // txProposalFinallyAccepted, TxProposalRemoved, NewIncomingTx, NewOutgoingTx
    this.events.subscribe('bwsEvent', (walletId: string) => {
      if (this.recentTransactionsEnabled) this.getNotifications();
      this.updateWallet(walletId);
    });

    // Create, Join, Import and Delete -> Get Wallets -> Update Status for All Wallets
    this.events.subscribe('status:updated', () => {
      this.updateTxps();
      this.setWallets();
    });
  }

  private handleDeepLinksNW() {
    var gui = (window as any).require('nw.gui');

    // This event is sent to an existent instance of Copay (only for standalone apps)
    gui.App.on('open', this.onOpenNW.bind(this));

    // Used at the startup of Copay
    var argv = gui.App.argv;
    if (argv && argv[0] && !(window as any)._urlHandled) {
      (window as any)._urlHandled = true;
      // The timeout waits for the components to be initialized
      setTimeout(() => {
        this.handleOpenUrl(argv[0]);
      }, 1000);
    }
  }

  onOpenNW(pathData) {
    if (pathData.indexOf('bitcoincash:/') != -1) {
      this.logger.debug('Bitcoin Cash URL found');
      this.handleOpenUrl(pathData.substring(pathData.indexOf('bitcoincash:/')));
    } else if (pathData.indexOf('bitcoin:/') != -1) {
      this.logger.debug('Bitcoin URL found');
      this.handleOpenUrl(pathData.substring(pathData.indexOf('bitcoin:/')));
    } else if (pathData.indexOf(this.appProvider.info.name + '://') != -1) {
      this.logger.debug(this.appProvider.info.name + ' URL found');
      this.handleOpenUrl(
        pathData.substring(pathData.indexOf(this.appProvider.info.name + '://'))
      );
    } else {
      this.logger.debug('URL found');
      this.handleOpenUrl(pathData);
    }
  }

  private handleDeepLinks() {
    // Check if app was resume by custom url scheme
    (window as any).handleOpenURL = (url: string) => {
      setTimeout(() => {
        this.zone.run(() => {
          this.logger.info('App was resumed by custom url scheme');
          this.handleOpenUrl(url);
        });
      }, 0);
    };

    // Check if app was opened by custom url scheme
    const lastUrl: string = (window as any).handleOpenURL_LastURL || '';
    if (lastUrl && lastUrl !== '') {
      delete (window as any).handleOpenURL_LastURL;
      setTimeout(() => {
        this.logger.info('App was opened by custom url scheme');
        this.handleOpenUrl(lastUrl);
      }, 0);
    }
  }

  private handleOpenUrl(url: string) {
    if (!this.incomingDataProvider.redir(url)) {
      this.logger.warn('Unknown URL! : ' + url);
    }
  }

  private startUpdatingWalletId(walletId: string) {
    this.updatingWalletId[walletId] = true;
  }

  private stopUpdatingWalletId(walletId: string) {
    setTimeout(() => {
      this.updatingWalletId[walletId] = false;
    }, 10000);
  }

  private setWallets = _.debounce(
    () => {
      this.wallets = this.profileProvider.getWallets();
      this.walletsBtc = this.profileProvider.getWallets({ coin: 'btc' });
      this.walletsBch = this.profileProvider.getWallets({ coin: 'bch' });
      this.updateAllWallets();
    },
    5000,
    {
      leading: true
    }
  );

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
      if (!info) {
        this.initFeedBackInfo();
      } else {
        let feedbackInfo = info;
        // Check if current version is greater than saved version
        let currentVersion = this.releaseProvider.getCurrentAppVersion();
        let savedVersion = feedbackInfo.version;
        let isVersionUpdated = this.feedbackProvider.isVersionUpdated(
          currentVersion,
          savedVersion
        );
        if (!isVersionUpdated) {
          this.initFeedBackInfo();
          return;
        }
        let now = moment().unix();
        let timeExceeded = now - feedbackInfo.time >= 24 * 7 * 60 * 60;
        this.showRateCard = timeExceeded && !feedbackInfo.sent;
        this.showCard.setShowRateCard(this.showRateCard);
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

  private updateWallet(walletId: string): void {
    if (this.updatingWalletId[walletId]) return;
    this.startUpdatingWalletId(walletId);
    let wallet = this.profileProvider.getWallet(walletId);
    this.walletProvider
      .getStatus(wallet, {})
      .then((status: any) => {
        wallet.status = status;
        wallet.error = null;
        this.profileProvider.setLastKnownBalance(
          wallet.id,
          wallet.status.availableBalanceStr
        );
        this.updateTxps();
        this.stopUpdatingWalletId(walletId);
      })
      .catch((err: any) => {
        this.logger.error(err);
        this.stopUpdatingWalletId(walletId);
      });
  }

  private updateTxps = _.debounce(
    () => {
      this.profileProvider
        .getTxps({ limit: 3 })
        .then((data: any) => {
          this.zone.run(() => {
            this.txps = data.txps;
            this.txpsN = data.n;
          });
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

  private getNotifications = _.debounce(
    () => {
      this.profileProvider
        .getNotifications({ limit: 3 })
        .then((data: any) => {
          this.zone.run(() => {
            this.notifications = data.notifications;
            this.notificationsN = data.total;
          });
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
    let wallets: any[] = [];
    let foundMessage = false;

    _.each(this.walletsBtc, wBtc => {
      wallets.push(wBtc);
    });

    _.each(this.walletsBch, wBch => {
      wallets.push(wBch);
    });

    if (_.isEmpty(wallets)) return;

    let i = wallets.length;
    let j = 0;

    let pr = ((wallet, cb) => {
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
    this.releaseProvider
      .getLatestAppVersion()
      .toPromise()
      .then(version => {
        this.logger.debug('Current app version:', version);
        var result = this.releaseProvider.checkForUpdates(version);
        this.logger.debug('Update available:', result.updateAvailable);
        if (result.updateAvailable) {
          this.newRelease = true;
          this.updateText =
            'There is a new version of ' +
            this.appProvider.info.nameCase +
            ' available';
        }
      })
      .catch(err => {
        this.logger.error('Error getLatestAppVersion', err);
      });
  }

  public openServerMessageLink(): void {
    let url = this.serverMessage.link;
    this.externalLinkProvider.open(url);
  }

  public goToAddView(): void {
    this.navCtrl.push(AddPage);
  }

  public goToWalletDetails(wallet: any): void {
    if (this.showReorderBtc || this.showReorderBch) return;
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
        this.onGoingProcessProvider.set('loadingTxInfo');
        this.walletProvider
          .getTxp(wallet, n.txpId)
          .then((txp: any) => {
            var _txp = txp;
            this.onGoingProcessProvider.clear();
            this.openTxpModal(_txp);
          })
          .catch((err: any) => {
            this.onGoingProcessProvider.clear();
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
      this.profileProvider.setWalletOrder(wallet.id, index, 'btc');
    });
  }

  public reorderWalletsBch(indexes): void {
    let element = this.walletsBch[indexes.from];
    this.walletsBch.splice(indexes.from, 1);
    this.walletsBch.splice(indexes.to, 0, element);
    _.each(this.walletsBch, (wallet: any, index: number) => {
      this.profileProvider.setWalletOrder(wallet.id, index, 'bch');
    });
  }

  public goToDownload(): void {
    let url = 'https://github.com/bitpay/copay/releases/latest';
    let optIn = true;
    let title = this.translate.instant('Update Available');
    let message = this.translate.instant(
      'An update to this app is available. For your security, please update to the latest version.'
    );
    let okText = this.translate.instant('View Update');
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

  public openTxpModal(tx: any): void {
    let modal = this.modalCtrl.create(
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
    const pageMap = {
      AmazonPage,
      BitPayCardIntroPage,
      CoinbasePage,
      GlideraPage,
      MercadoLibrePage,
      ShapeshiftPage
    };
    this.navCtrl.push(pageMap[page]);
  }

  public goToCard(cardId): void {
    this.navCtrl.push(BitPayCardPage, { id: cardId });
  }

  public doRefresh(refresher) {
    refresher.pullMin = 90;
    this.updateAllWallets();
    setTimeout(() => {
      refresher.complete();
    }, 2000);
  }
}
