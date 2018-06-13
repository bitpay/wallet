import { Component, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  Platform
} from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';

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
import { ActivityPage } from './activity/activity';
import { ProposalsPage } from './proposals/proposals';

// Providers
import { AddressBookProvider } from '../../providers/address-book/address-book';
import { AppProvider } from '../../providers/app/app';
import { BitPayCardProvider } from '../../providers/bitpay-card/bitpay-card';
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { ConfigProvider } from '../../providers/config/config';
import { EmailNotificationsProvider } from '../../providers/email-notifications/email-notifications';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { FeedbackProvider } from '../../providers/feedback/feedback';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { Logger } from '../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { PlatformProvider } from '../../providers/platform/platform';
import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';
import { ReleaseProvider } from '../../providers/release/release';
import { ReplaceParametersProvider } from '../../providers/replace-parameters/replace-parameters';
import { WalletProvider } from '../../providers/wallet/wallet';
import { SettingsPage } from '../settings/settings';
import { WalletTabsPage } from '../wallet-tabs/wallet-tabs';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  @ViewChild('showCard') showCard;
  public wallets;
  public walletsBtc;
  public walletsBch;
  public cachedBalanceUpdateOn: string;
  public recentTransactionsEnabled: boolean;
  public txps;
  public txpsN: number;
  public notifications;
  public notificationsN: number;
  public serverMessage;
  public addressbook;
  public newRelease: boolean;
  public updateText: string;
  public homeIntegrations;
  public bitpayCardItems;
  public showBitPayCard: boolean = false;

  public showRateCard: boolean;
  public homeTip: boolean;
  public showReorderBtc: boolean;
  public showReorderBch: boolean;
  public showIntegration;

  private isNW: boolean;
  private updatingWalletId: object;
  private zone;

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
    private emailProvider: EmailNotificationsProvider,
    private replaceParametersProvider: ReplaceParametersProvider
  ) {
    this.updatingWalletId = {};
    this.addressbook = {};
    this.cachedBalanceUpdateOn = '';
    this.isNW = this.platformProvider.isNW;
    this.showReorderBtc = false;
    this.showReorderBch = false;
    this.zone = new NgZone({ enableLongStackTrace: false });
  }

  ionViewWillEnter() {
    this.recentTransactionsEnabled = this.configProvider.get().recentTransactions.enabled;

    // Update list of wallets, status and TXPs
    this.setWallets();

    this.addressBookProvider
      .list()
      .then(ab => {
        this.addressbook = ab || {};
      })
      .catch(err => {
        this.logger.error(err);
      });

    // Update Tx Notifications
    this.getNotifications();
  }

  ionViewDidEnter() {
    if (this.isNW) this.checkUpdate();
    this.checkHomeTip();
    this.checkFeedbackInfo();

    // BWS Events: Update Status per Wallet
    // NewBlock, NewCopayer, NewAddress, NewTxProposal, TxProposalAcceptedBy, TxProposalRejectedBy, txProposalFinallyRejected,
    // txProposalFinallyAccepted, TxProposalRemoved, NewIncomingTx, NewOutgoingTx
    this.events.subscribe('bwsEvent', (walletId: string) => {
      this.getNotifications();
      this.updateWallet(walletId);
    });

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
    this.bitPayCardProvider.get({}, (_, cards) => {
      this.zone.run(() => {
        this.showBitPayCard = this.appProvider.info._enabledExtensions.debitcard
          ? true
          : false;
        this.bitpayCardItems = cards;
      });
    });
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad HomePage');

    this.checkEmailLawCompliance();

    // Create, Join, Import and Delete -> Get Wallets -> Update Status for All Wallets
    this.events.subscribe('status:updated', () => {
      this.updateTxps();
      this.setWallets();
    });

    this.plt.resume.subscribe(() => {
      this.getNotifications();
      this.updateTxps();
      this.setWallets();
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe('bwsEvent');
  }

  private openEmailDisclaimer() {
    let message = this.translate.instant(
      'By providing your email address, you give explicit consent to BitPay to use your email address to send you email notifications about payments.'
    );
    let title = this.translate.instant('Privacy Policy update');
    let okText = this.translate.instant('Accept');
    let cancelText = this.translate.instant('Disable notifications');
    this.popupProvider
      .ionicConfirm(title, message, okText, cancelText)
      .then(ok => {
        if (ok) {
          // Accept new Privacy Policy
          this.persistenceProvider.setEmailLawCompliance('accepted');
        } else {
          // Disable email notifications
          this.persistenceProvider.setEmailLawCompliance('rejected');
          this.emailProvider.updateEmail({
            enabled: false,
            email: 'null@email'
          });
        }
      });
  }

  private checkEmailLawCompliance(): void {
    setTimeout(() => {
      if (this.emailProvider.getEmailIfEnabled()) {
        this.persistenceProvider.getEmailLawCompliance().then(value => {
          if (!value) this.openEmailDisclaimer();
        });
      }
    }, 2000);
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
      this.walletsBtc = _.filter(this.wallets, (x: any) => {
        return x.credentials.coin == 'btc';
      });
      this.walletsBch = _.filter(this.wallets, (x: any) => {
        return x.credentials.coin == 'bch';
      });
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
    this.persistenceProvider.getFeedbackInfo().then(info => {
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
    this.persistenceProvider.setFeedbackInfo({
      time: moment().unix(),
      version: this.releaseProvider.getCurrentAppVersion(),
      sent: false
    });
    this.showRateCard = false;
  }

  private updateWallet(walletId: string): void {
    if (this.updatingWalletId[walletId]) return;
    this.startUpdatingWalletId(walletId);
    let wallet = this.profileProvider.getWallet(walletId);
    this.walletProvider
      .getStatus(wallet, {})
      .then(status => {
        wallet.status = status;
        wallet.error = null;
        this.profileProvider.setLastKnownBalance(
          wallet.id,
          wallet.status.availableBalanceStr
        );
        this.updateTxps();
        this.stopUpdatingWalletId(walletId);
      })
      .catch(err => {
        this.logger.error(err);
        this.stopUpdatingWalletId(walletId);
      });
  }

  private updateTxps = _.debounce(
    () => {
      this.profileProvider
        .getTxps({ limit: 3 })
        .then(data => {
          this.zone.run(() => {
            this.txps = data.txps;
            this.txpsN = data.n;
          });
        })
        .catch(err => {
          this.logger.error(err);
        });
    },
    5000,
    {
      leading: true
    }
  );

  private getNotifications = _.debounce(
    () => {
      if (!this.recentTransactionsEnabled) return;
      this.profileProvider
        .getNotifications({ limit: 3 })
        .then(data => {
          this.zone.run(() => {
            this.notifications = data.notifications;
            this.notificationsN = data.total;
          });
        })
        .catch(err => {
          this.logger.error(err);
        });
    },
    5000,
    {
      leading: true
    }
  );

  private updateAllWallets(): void {
    let foundMessage = false;

    if (_.isEmpty(this.wallets)) return;

    let i = this.wallets.length;
    let j = 0;

    let pr = ((wallet, cb) => {
      this.walletProvider
        .getStatus(wallet, {})
        .then(status => {
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

    _.each(this.wallets, wallet => {
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
          this.updateText = this.replaceParametersProvider.replace(
            this.translate.instant(
              'There is a new version of {{nameCase}} available'
            ),
            { nameCase: this.appProvider.info.nameCase }
          );
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

  public goToWalletDetails(wallet): void {
    if (this.showReorderBtc || this.showReorderBch) return;
    if (!wallet.isComplete()) {
      this.navCtrl.push(CopayersPage, {
        walletId: wallet.credentials.walletId
      });
      return;
    }
    this.modalCtrl
      .create(
        WalletTabsPage,
        {
          walletId: wallet.credentials.walletId
        },
        {
          cssClass: 'fullscreen-modal'
        }
      )
      .present();
  }

  public openNotificationModal(n) {
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
          .then(txp => {
            var _txp = txp;
            this.onGoingProcessProvider.clear();
            this.openTxpModal(_txp);
          })
          .catch(() => {
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
    _.each(this.walletsBtc, (wallet, index: number) => {
      this.profileProvider.setWalletOrder(wallet.id, index);
    });
  }

  public reorderWalletsBch(indexes): void {
    let element = this.walletsBch[indexes.from];
    this.walletsBch.splice(indexes.from, 1);
    this.walletsBch.splice(indexes.to, 0, element);
    _.each(this.walletsBch, (wallet, index: number) => {
      this.profileProvider.setWalletOrder(wallet.id, index);
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

  public openTxpModal(tx): void {
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
    this.getNotifications();
    setTimeout(() => {
      refresher.complete();
    }, 2000);
  }

  public scan() {
    this.navCtrl.parent.select(2);
  }

  public settings() {
    this.navCtrl.push(SettingsPage);
  }
}
