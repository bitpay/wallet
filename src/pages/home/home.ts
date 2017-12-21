import { Component } from '@angular/core';
import { NavController, Events, ModalController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

// Pages
import { ActivityPage } from './activity/activity';
import { AddPage } from "../add/add";
import { AmazonPage } from '../integrations/amazon/amazon';
import { BuyAndSellPage } from '../buy-and-sell/buy-and-sell';
import { CopayersPage } from '../add/copayers/copayers';
import { GlideraPage } from '../integrations/glidera/glidera';
import { MercadoLibrePage } from '../integrations/mercado-libre/mercado-libre';
import { ProposalsPage } from './proposals/proposals';
import { TxDetailsPage } from '../tx-details/tx-details';
import { TxpDetailsPage } from '../txp-details/txp-details';
import { WalletDetailsPage } from '../wallet-details/wallet-details';

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
import { BuyAndSellProvider } from '../../providers/buy-and-sell/buy-and-sell';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { BitPayCardProvider } from '../../providers/bitpay-card/bitpay-card';
import { NextStepsProvider } from '../../providers/next-steps/next-steps';

import * as _ from 'lodash';

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
  public buyAndSellItems: Array<any>;
  public bitpayCardItems: Array<any>;
  public nextStepsItems: Array<any>;
  public hideNextSteps: boolean;

  private isNW: boolean;

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
    private buyAndSellProvider: BuyAndSellProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private bitPayCardProvider: BitPayCardProvider,
    private nextStepsProvider: NextStepsProvider
  ) {
    this.cachedBalanceUpdateOn = '';
    this.isNW = this.platformProvider.isNW;
    this.hideNextSteps = false;
  }

  ionViewWillEnter() {
    this.config = this.configProvider.get();
    this.wallets = this.profileProvider.getWallets();

    this.recentTransactionsEnabled = this.config.recentTransactions.enabled;
    if (this.recentTransactionsEnabled) this.getNotifications();

    this.pushNotificationsProvider.init();

    this.buyAndSellItems = this.buyAndSellProvider.getLinked();
    this.homeIntegrations = this.homeIntegrationsProvider.get();

    this.bitPayCardProvider.get({}, (err, cards) => {
      this.bitpayCardItems = cards;
    });

    if (this.config.showNextSteps.enabled) {
      this.nextStepsItems = this.nextStepsProvider.get();
    } else {
      this.nextStepsItems = null;
    }

  }

  ionViewDidEnter() {

    if (this.isNW) this.checkUpdate();
    this.updateAllWallets();

    this.addressBookProvider.list().then((ab: any) => {
      this.addressbook = ab || {};
    }).catch((err) => {
      this.logger.error(err);
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
  }

  ionViewWillLeave() {
    this.events.unsubscribe('bwsEvent');
    this.events.unsubscribe('Local/TxAction');
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad HomePage');
  }

  private updateWallet(wallet: any): void {
    this.logger.debug('Updating wallet:' + wallet.name)
    this.walletProvider.getStatus(wallet, {}).then((status: any) => {
      wallet.status = status;
      this.updateTxps();
    }).catch((err: any) => {
      this.logger.error(err);
    });
  };

  private updateTxps(): void {
    this.profileProvider.getTxps({ limit: 3 }).then((data: any) => {
      this.txps = data.txps;
      this.txpsN = data.n;
    }).catch((err: any) => {
      this.logger.error(err);
    });
  }

  private getNotifications(): void {
    this.profileProvider.getNotifications({ limit: 3 }).then((data: any) => {
      this.notifications = data.notifications;
      this.notificationsN = data.total;
    }).catch((err: any) => {
      this.logger.error(err);
    });
  };

  private updateAllWallets(): void {
    let wallets: Array<any> = [];
    let foundMessage = false;
    this.walletsBtc = this.profileProvider.getWallets({ coin: 'btc' });
    this.walletsBch = this.profileProvider.getWallets({ coin: 'bch' });

    _.each(this.walletsBtc, (wBtc) => {
      wallets.push(wBtc);
    });

    _.each(this.walletsBch, (wBch) => {
      wallets.push(wBch);
    });

    if (_.isEmpty(wallets)) return;

    let i = wallets.length;
    let j = 0;

    _.each(wallets, (wallet: any) => {
      this.walletProvider.getStatus(wallet, {}).then((status: any) => {
        wallet.status = status;
        wallet.error = null;

        if (!foundMessage && !_.isEmpty(status.serverMessage)) {
          this.serverMessage = status.serverMessage;
          foundMessage = true;
        }

        this.profileProvider.setLastKnownBalance(wallet.id, wallet.status.availableBalanceStr);

        if (++j == i) {
          this.updateTxps();
        }

      }).catch((err) => {
        wallet.error = (err === 'WALLET_NOT_REGISTERED') ? 'Wallet not registered' : this.bwcErrorProvider.msg(err);
        this.logger.warn(err);
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
  };

  public goToAddView(coin?: string): void {
    this.navCtrl.push(AddPage, { coin: coin });
  }

  public goToWalletDetails(wallet: any): void {
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
          return this.popupProvider.ionicAlert('Error', 'Transaction not found'); //TODO gettextcatalog
        });
      }
    }
  }

  public goToDownload(): void {
    let url = 'https://github.com/bitpay/copay/releases/latest';
    let optIn = true;
    let title = 'Update Available'; //TODO gettextcatalog
    let message = 'An update to this app is available. For your security, please update to the latest version.'; //TODO gettextcatalog
    let okText = 'View Update'; //TODO gettextcatalog
    let cancelText = 'Go Back'; //TODO gettextcatalog
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  };

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
      case 'MercadoLibrePage':
        this.navCtrl.push(MercadoLibrePage);
        break;
      case 'AmazonPage':
        this.navCtrl.push(AmazonPage);
        break;
      case 'BitPayCardIntroPage':
        //push BitPayCardIntroPage
        break;
      case 'BuyAndSellPage':
        this.navCtrl.push(BuyAndSellPage);
        break;
      case 'GlideraPage':
        this.navCtrl.push(GlideraPage);
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
