import { Component } from '@angular/core';
import { NavController, NavParams, ActionSheetController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { PlatformProvider } from '../../../../providers/platform/platform';
import { PopupProvider } from '../../../../providers/popup/popup';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { GlideraProvider } from '../../../../providers/glidera/glidera';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { TxFormatProvider } from '../../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../../providers/wallet/wallet';

import * as _ from 'lodash';

@Component({
  selector: 'page-buy-glidera',
  templateUrl: 'buy-glidera.html',
})
export class BuyGlideraPage {

  public isCordova: boolean;
  public sendStatus: string;
  public token: string;
  public isFiat: boolean;
  public network: string;
  public wallet: any;
  public wallets: any;
  public amountUnitStr: string;
  public buyInfo: any;

  private currency: string;
  private amount: number;
  private coin: string;

  constructor(
    private platformProvider: PlatformProvider,
    private logger: Logger,
    private popupProvider: PopupProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private glideraProvider: GlideraProvider,
    private profileProvider: ProfileProvider,
    private txFormatProvider: TxFormatProvider,
    private walletProvider: WalletProvider,
    private actionSheetCtrl: ActionSheetController,
  ) {
    this.coin = 'btc';
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewWillEnter() {
    this.isFiat = this.navParams.data.currency != 'BTC' ? true : false;
    this.amount = this.navParams.data.amountFiat;
    this.currency = this.navParams.data.currency.toUpperCase();

    this.network = this.glideraProvider.getNetwork();
    this.wallets = this.profileProvider.getWallets({
      onlyComplete: true,
      network: this.network,
      coin: this.coin
    });

    if (_.isEmpty(this.wallets)) {
      this.showErrorAndBack('No wallets available');
      return;
    }
    this.onWalletSelect(this.wallets[0]); // Default first wallet
  }

  private showErrorAndBack(err): void {
    this.sendStatus = '';
    this.logger.error(err);
    err = err.errors ? err.errors[0].message : err || '';
    this.popupProvider.ionicAlert('Error', err).then(() => {
      this.navCtrl.pop();
    });
  }

  private showError(err): void {
    this.sendStatus = '';
    this.logger.error(err);
    err = err.errors ? err.errors[0].message : err;
    this.popupProvider.ionicAlert('Error', err);
  }

  private statusChangeHandler(processName: string, isOn: boolean): void {
    let showName = this.onGoingProcessProvider.getShowName(processName);
    this.logger.debug('statusChangeHandler: ', processName, showName, isOn);
    if (processName == 'buyingBitcoin' && !isOn) {
      this.sendStatus = 'success';
    } else if (showName) {
      this.sendStatus = showName;
    }
  }

  private processPaymentInfo(): void {
    this.onGoingProcessProvider.set('connectingGlidera', true);
    this.glideraProvider.init((err, data) => {
      if (err) {
        this.onGoingProcessProvider.set('connectingGlidera', false);
        this.showErrorAndBack(err);
        return;
      }
      this.token = data.token;
      var price: any = {};
      if (this.isFiat) {
        price.fiat = this.amount;
      } else {
        price.qty = this.amount;
      }
      this.glideraProvider.buyPrice(this.token, price, (err, buy) => {
        this.onGoingProcessProvider.set('connectingGlidera', false);
        if (err) {
          this.showErrorAndBack(err);
          return;
        }
        this.buyInfo = buy;
      });
    });
  }

  private ask2FaCode(mode, cb): Function {
    if (mode != 'NONE') {
      // SHOW PROMPT
      var title = 'Please, enter the code below';
      var message;
      if (mode == 'PIN') {
        message = 'You have enabled PIN based two-factor authentication.';
      } else if (mode == 'AUTHENTICATOR') {
        message = 'Use an authenticator app (Authy or Google Authenticator).';
      } else {
        message = 'A SMS containing a confirmation code was sent to your phone.';
      }
      this.popupProvider.ionicPrompt(title, message).then((twoFaCode) => {
        if (typeof twoFaCode == 'undefined') return cb();
        return cb(twoFaCode);
      });
    } else {
      return cb();
    }
  }

  public buyConfirm(): void {
    let message = 'Buy bitcoin for ' + this.amount + ' ' + this.currency;
    let okText = 'Confirm';
    let cancelText = 'Cancel';
    this.popupProvider.ionicConfirm(null, message, okText, cancelText).then((ok) => {
      if (!ok) return;
      this.onGoingProcessProvider.set('buyingBitcoin', true);
      this.statusChangeHandler('buyingBitcoin', true);
      this.glideraProvider.get2faCode(this.token, (err, tfa) => {
        if (err) {
          this.onGoingProcessProvider.set('buyingBitcoin', false);
          this.statusChangeHandler('buyingBitcoin', false);
          this.showError(err);
          return;
        }
        this.ask2FaCode(tfa.mode, (twoFaCode) => {
          if (tfa.mode != 'NONE' && _.isEmpty(twoFaCode)) {
            this.onGoingProcessProvider.set('buyingBitcoin', false);
            this.statusChangeHandler('buyingBitcoin', false);
            this.showError('No code entered');
            return;
          }

          this.walletProvider.getAddress(this.wallet, false).then((walletAddr) => {
            let data = {
              destinationAddress: walletAddr,
              qty: this.buyInfo.qty,
              priceUuid: this.buyInfo.priceUuid,
              useCurrentPrice: false,
              ip: null
            };
            this.glideraProvider.buy(this.token, twoFaCode, data, (err, data) => {
              this.onGoingProcessProvider.set('buyingBitcoin', false);
              this.statusChangeHandler('buyingBitcoin', false);
              if (err) return this.showError(err);
              this.logger.info(data);
            });
          }).catch(() => {
            this.onGoingProcessProvider.set('buyingBitcoin', false);
            this.statusChangeHandler('buyingBitcoin', false);
            this.showError(err);
          });
        });
      });
    });
  }

  public showWallets(): void {
    let buttons: Array<any> = [];

    _.each(this.wallets, (w: any) => {
      let walletButton: Object = {
        text: w.credentials.walletName,
        cssClass: 'wallet-' + w.network,
        icon: 'wallet',
        handler: () => {
          this.onWalletSelect(w);
        }
      }
      buttons.push(walletButton);
    });

    const actionSheet = this.actionSheetCtrl.create({
      title: 'Receive in',
      buttons: buttons
    });

    actionSheet.present();
  }


  public onWalletSelect(wallet): void {
    this.wallet = wallet;
    let parsedAmount = this.txFormatProvider.parseAmount(
      this.coin,
      this.amount,
      this.currency);

    this.amount = parsedAmount.amount;
    this.currency = parsedAmount.currency;
    this.amountUnitStr = parsedAmount.amountUnitStr;
    this.processPaymentInfo();
  }

  public goBackHome(): void {
    this.sendStatus = '';
    this.navCtrl.remove(3, 1);
    this.navCtrl.pop();
  }

}