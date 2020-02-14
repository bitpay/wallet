import { Component, NgZone } from '@angular/core';
import { StatusBar } from '@ionic-native/status-bar';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

import * as _ from 'lodash';

// providers
import { ActionSheetProvider } from '../../../../providers/action-sheet/action-sheet';
import { CoinbaseProvider } from '../../../../providers/coinbase/coinbase';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../../providers/platform/platform';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';

// Page
import { AmountPage } from '../../../send/amount/amount';
import { CoinbaseTxDetailsPage } from '../coinbase-tx-details/coinbase-tx-details';

const TIMEOUT_FOR_REFRESHER = 1000;

@Component({
  selector: 'page-coinbase-account',
  templateUrl: 'coinbase-account.html'
})
export class CoinbaseAccountPage {
  public id: string;
  public isCordova: boolean;
  public data: object = {};
  private zone;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private coinbase: CoinbaseProvider,
    private logger: Logger,
    private popupProvider: PopupProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private modalCtrl: ModalController,
    private platformProvider: PlatformProvider,
    private profileProvider: ProfileProvider,
    private statusBar: StatusBar,
    protected onGoingProcessProvider: OnGoingProcessProvider
  ) {
    this.zone = new NgZone({ enableLongStackTrace: false });
    this.id = this.navParams.data.id;
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CoinbaseAccountPage');
  }

  ionViewWillEnter() {
    if (this.platformProvider.isIOS) {
      this.statusBar.styleLightContent();
    }
    this.updateAll();
  }

  ionViewWillLeave() {
    if (this.platformProvider.isIOS) {
      this.statusBar.styleDefault();
    }
  }

  private updateAll() {
    this.zone.run(() => {
      this.coinbase.getAccount(this.id, this.data);
      this.coinbase.getTransactions(this.id, this.data);
      this.coinbase.getCurrentUser(this.data);
    });
  }

  public doRefresh(refresher) {
    this.updateAll();

    setTimeout(() => {
      refresher.complete();
    }, TIMEOUT_FOR_REFRESHER);
  }

  public showErrorAndBack(err): void {
    this.logger.error(err);
    err = err.errors ? err.errors[0].message : err;
    this.popupProvider.ionicAlert('Error', err).then(() => {
      this.navCtrl.pop();
    });
  }

  public showError(err): void {
    this.logger.error(err);
    err = err.errors ? err.errors[0].message : err;
    this.popupProvider.ionicAlert('Error', err);
  }

  public openTx(tx) {
    let modal = this.modalCtrl.create(CoinbaseTxDetailsPage, { tx });
    modal.present();
  }

  public deposit(): void {
    const account_name = this.data['account'].name;
    const native_currency = this.data['user'].native_currency;
    const coin = this.data['account'].currency.code.toLowerCase();
    const wallets = this.profileProvider.getWallets({
      onlyComplete: true,
      network: 'livenet',
      hasFunds: true,
      coin
    });

    if (_.isEmpty(wallets)) {
      this.showError('No wallet available to deposit');
      return;
    }

    const params = {
      wallets,
      selectedWalletId: null,
      title: 'Transfer from'
    };
    const walletSelector = this.actionSheetProvider.createWalletSelector(
      params
    );
    walletSelector.present();
    walletSelector.onDidDismiss(fromWallet => {
      if (!fromWallet) return;
      this.onGoingProcessProvider.set('generatingNewAddress');
      this.coinbase
        .getAddress(this.id, 'Transfer from BitPay: ' + fromWallet.name)
        .then(data => {
          this.onGoingProcessProvider.clear();
          this.navCtrl.push(AmountPage, {
            currency: native_currency,
            coin,
            walletId: fromWallet.id,
            fromWalletDetails: true,
            toAddress: data.address,
            description: 'Deposit to: ' + account_name,
            recipientType: 'coinbase',
            fromCoinbase: { accountId: this.id, accountName: account_name }
          });
        });
    });
  }

  public withdraw(): void {
    const native_currency = this.data['user'].native_currency;
    const coin = this.data['account'].currency.code.toLowerCase();
    const wallets = this.profileProvider.getWallets({
      onlyComplete: true,
      backedUp: true,
      network: 'livenet',
      coin
    });

    if (_.isEmpty(wallets)) {
      this.showError('No wallet available to withdraw');
      return;
    }

    const params = {
      wallets,
      selectedWalletId: null,
      title: 'Transfer to'
    };
    const walletSelector = this.actionSheetProvider.createWalletSelector(
      params
    );
    walletSelector.present();
    walletSelector.onDidDismiss(toWallet => {
      if (!toWallet) return;
      this.navCtrl.push(AmountPage, {
        id: this.id,
        toWalletId: toWallet.id,
        currency: native_currency,
        coin,
        nextPage: 'CoinbaseWithdrawPage',
        description: 'Transfer to BitPay: ' + toWallet.name
      });
    });
  }
}
