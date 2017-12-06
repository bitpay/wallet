import { Component } from '@angular/core';
import { NavController, Events, ModalController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

// Pages
import { AddPage } from "../add/add";
import { CopayersPage } from '../add/copayers/copayers';
import { WalletDetailsPage } from '../wallet-details/wallet-details';
import { TxDetailsPage } from '../tx-details/tx-details';
import { TxpDetailsPage } from '../txp-details/txp-details';

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
import { TimeProvider } from '../../providers/time/time';
import { AddressBookProvider } from '../../providers/address-book/address-book';

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
    private addressBookProvider: AddressBookProvider
  ) {
    this.cachedBalanceUpdateOn = '';
    this.config = this.configProvider.get();
  }

  ionViewWillEnter() {
    this.wallets = this.profileProvider.getWallets();
  }

  ionViewDidEnter() {
    this.checkUpdate();
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
    this.events.subscribe('Local/TxAction', (e, walletId) => {
      this.logger.debug('Got action for wallet ' + walletId);
      var wallet = this.profileProvider.getWallet(walletId);
      this.updateWallet(wallet);
      if (this.recentTransactionsEnabled) this.getNotifications();
    });

    this.recentTransactionsEnabled = this.config.recentTransactions.enabled;
    if (this.recentTransactionsEnabled) this.getNotifications();

    this.pushNotificationsProvider.init();
  }

  ionViewWillLeave() {
    this.events.unsubscribe('bwsEvent');
    this.events.unsubscribe('Local/TxAction');
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad HomePage');
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

    _.each(this.walletsBtc, function (wBtc) {
      wallets.push(wBtc);
    });

    _.each(this.walletsBch, function (wBch) {
      wallets.push(wBch);
    });

    if (_.isEmpty(wallets)) return;

    let i = wallets.length;
    let j = 0;

    _.each(wallets, (wallet: any) => {
      this.walletProvider.getStatus(wallet, {}).then((status: any) => {
        this.cachedBalanceUpdateOn = wallet.cachedBalanceUpdatedOn ? ' - ' + moment(wallet.cachedBalanceUpdatedOn * 1000).fromNow() : '';
        this.profileProvider.setLastKnownBalance(wallet.id, status.availableBalanceSat);
        wallet.status = status;
        wallet.error = null;

        if (!foundMessage && !_.isEmpty(status.serverMessage)) {
          this.serverMessage = status.serverMessage;
          foundMessage = true;
        }

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
        console.log('Current app version:', version);
        var result = this.releaseProvider.checkForUpdates(version);
        console.log('Update available:', result.updateAvailable);
      })
      .catch((err) => {
        console.log('Error:', err);
      })
  }

  public openServerMessageLink() {
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

  public openTxpModal(tx: any): void {
    let modal = this.modalCtrl.create(TxpDetailsPage, { tx }, { showBackdrop: false, enableBackdropDismiss: false });
    modal.present();
  }

}
