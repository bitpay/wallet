import { Component, ViewChild } from '@angular/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

// pages
import { FinishModalPage } from '../../../finish/finish';
import { GlideraPage } from '../../../integrations/glidera/glidera';

// providers
import { ActionSheetProvider } from '../../../../providers/action-sheet/action-sheet';
import { GlideraProvider } from '../../../../providers/glidera/glidera';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../../providers/platform/platform';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { TxFormatProvider } from '../../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../../providers/wallet/wallet';

import * as _ from 'lodash';
import { setPrice } from '../../integrations';

@Component({
  selector: 'page-buy-glidera',
  templateUrl: 'buy-glidera.html'
})
export class BuyGlideraPage {
  @ViewChild('slideButton')
  slideButton;

  public isCordova: boolean;
  public token: string;
  public isFiat: boolean;
  public network: string;
  public wallet;
  public wallets;
  public amountUnitStr: string;
  public buyInfo;

  private currency: string;
  private amount: number;
  private coin: string;
  public isOpenSelector: boolean;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
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
    private modalCtrl: ModalController
  ) {
    this.coin = 'btc';
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewWillLeave() {
    this.navCtrl.swipeBackEnabled = true;
  }

  ionViewWillEnter() {
    this.isOpenSelector = false;
    this.navCtrl.swipeBackEnabled = false;
    this.isFiat = this.navParams.data.currency != 'BTC' ? true : false;
    this.amount = this.navParams.data.amount;
    this.currency = this.navParams.data.currency;

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
    if (this.isCordova) this.slideButton.isConfirmed(false);
    this.logger.error(err);
    err = err.errors ? err.errors[0].message : err || '';
    this.popupProvider.ionicAlert('Error', err).then(() => {
      this.navCtrl.pop();
    });
  }

  private showError(err): void {
    if (this.isCordova) this.slideButton.isConfirmed(false);
    this.logger.error(err);
    err = err.errors ? err.errors[0].message : err;
    this.popupProvider.ionicAlert('Error', err);
  }

  private processPaymentInfo(): void {
    this.onGoingProcessProvider.set('connectingGlidera');
    this.glideraProvider.init((err, data) => {
      if (err) {
        this.onGoingProcessProvider.clear();
        this.showErrorAndBack(err);
        return;
      }
      this.token = data.token;
      var price = setPrice(this.isFiat, this.amount);
      this.glideraProvider.buyPrice(this.token, price, (err, buy) => {
        this.onGoingProcessProvider.clear();
        if (err) {
          this.showErrorAndBack(err);
          return;
        }
        this.buyInfo = buy;
      });
    });
  }

  private ask2FaCode(mode, cb): () => any {
    if (mode != 'NONE') {
      // SHOW PROMPT
      var title = 'Please, enter the code below';
      var message;
      if (mode == 'PIN') {
        message = 'You have enabled PIN based two-factor authentication.';
      } else if (mode == 'AUTHENTICATOR') {
        message = 'Use an authenticator app (Authy or Google Authenticator).';
      } else {
        message =
          'A SMS containing a confirmation code was sent to your phone.';
      }
      this.popupProvider.ionicPrompt(title, message).then(twoFaCode => {
        if (typeof twoFaCode == 'undefined') return cb();
        return cb(twoFaCode);
      });
    } else {
      return cb();
    }
    return undefined;
  }

  public buyConfirm(): void {
    let message = 'Buy bitcoin for ' + this.amount + ' ' + this.currency;
    let okText = 'Confirm';
    let cancelText = 'Cancel';
    this.popupProvider
      .ionicConfirm(null, message, okText, cancelText)
      .then(ok => {
        if (!ok) {
          if (this.isCordova) this.slideButton.isConfirmed(false);
          return;
        }

        this.onGoingProcessProvider.set('buyingBitcoin');
        this.glideraProvider.get2faCode(this.token, (err, tfa) => {
          if (err) {
            this.onGoingProcessProvider.clear();
            this.showError(err);
            return;
          }
          this.ask2FaCode(tfa.mode, twoFaCode => {
            if (tfa.mode != 'NONE' && _.isEmpty(twoFaCode)) {
              this.onGoingProcessProvider.clear();
              this.showError('No code entered');
              return;
            }

            this.walletProvider
              .getAddress(this.wallet, false)
              .then(walletAddr => {
                let data = {
                  destinationAddress: walletAddr,
                  qty: this.buyInfo.qty,
                  priceUuid: this.buyInfo.priceUuid,
                  useCurrentPrice: false,
                  ip: null
                };
                this.glideraProvider.buy(
                  this.token,
                  twoFaCode,
                  data,
                  (err, data) => {
                    this.onGoingProcessProvider.clear();
                    if (err) return this.showError(err);
                    this.logger.info(
                      'Glidera Buy Info: ',
                      JSON.stringify(data)
                    );
                    this.openFinishModal();
                  }
                );
              })
              .catch(() => {
                this.onGoingProcessProvider.clear();
                this.showError(err);
              });
          });
        });
      });
  }

  public showWallets(): void {
    this.isOpenSelector = true;
    let id = this.wallet ? this.wallet.credentials.walletId : null;
    const params = {
      wallets: this.wallets,
      selectedWalletId: id,
      title: 'Receive in'
    };
    const walletSelector = this.actionSheetProvider.createWalletSelector(
      params
    );
    walletSelector.present();
    walletSelector.onDidDismiss(wallet => {
      if (!_.isEmpty(wallet)) this.onWalletSelect(wallet);
      this.isOpenSelector = false;
    });
  }

  public onWalletSelect(wallet): void {
    this.wallet = wallet;
    let parsedAmount = this.txFormatProvider.parseAmount(
      this.coin,
      this.amount,
      this.currency
    );

    this.amount = parsedAmount.amount;
    this.currency = parsedAmount.currency;
    this.amountUnitStr = parsedAmount.amountUnitStr;
    this.processPaymentInfo();
  }

  private openFinishModal(): void {
    let finishText = 'Bought';
    let finishComment =
      'A transfer has been initiated from your bank account. Your bitcoins should arrive to your wallet in 2-4 business day';
    let modal = this.modalCtrl.create(
      FinishModalPage,
      { finishText, finishComment },
      { showBackdrop: true, enableBackdropDismiss: false }
    );
    modal.present();
    modal.onDidDismiss(async () => {
      await this.navCtrl.popToRoot({ animate: false });
      await this.navCtrl.push(GlideraPage, null, { animate: false });
    });
  }
}
