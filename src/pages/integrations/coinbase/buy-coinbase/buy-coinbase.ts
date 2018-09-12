import { Component, ViewChild } from '@angular/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../../providers/logger/logger';

// providers
import { ActionSheetProvider } from '../../../../providers/action-sheet/action-sheet';
import { CoinbaseProvider } from '../../../../providers/coinbase/coinbase';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../../providers/platform/platform';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { TxFormatProvider } from '../../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../../providers/wallet/wallet';

// pages
import { FinishModalPage } from '../../../finish/finish';
import { CoinbasePage } from '../coinbase';

@Component({
  selector: 'page-buy-coinbase',
  templateUrl: 'buy-coinbase.html'
})
export class BuyCoinbasePage {
  @ViewChild('slideButton')
  slideButton;

  private amount: string;
  private currency: string;
  private coin: string;
  private wallets;

  public paymentMethods;
  public selectedPaymentMethodId;
  public buyPrice: string;
  public buyRequestInfo;
  public amountUnitStr: string;
  public wallet;
  public network: string;
  public isFiat: boolean;
  public isOpenSelector: boolean;

  // Platform info
  public isCordova: boolean;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private coinbaseProvider: CoinbaseProvider,
    private logger: Logger,
    private popupProvider: PopupProvider,
    private navCtrl: NavController,
    private externalLinkProvider: ExternalLinkProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private navParams: NavParams,
    private walletProvider: WalletProvider,
    private txFormatProvider: TxFormatProvider,
    private profileProvider: ProfileProvider,
    private modalCtrl: ModalController,
    private platformProvider: PlatformProvider
  ) {
    this.coin = 'btc';
    this.isFiat = this.navParams.data.currency != 'BTC' ? true : false;
    this.amount = this.navParams.data.amount;
    this.currency = this.navParams.data.currency;
    this.network = this.coinbaseProvider.getNetwork();
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad BuyCoinbasePage');
  }

  ionViewWillLeave() {
    this.navCtrl.swipeBackEnabled = true;
  }

  ionViewWillEnter() {
    this.isOpenSelector = false;
    this.navCtrl.swipeBackEnabled = false;
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
    err = err.errors ? err.errors[0].message : err;
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
    this.onGoingProcessProvider.set('connectingCoinbase');
    this.coinbaseProvider.init((err, res) => {
      if (err) {
        this.onGoingProcessProvider.clear();
        this.showErrorAndBack(err);
        return;
      }
      let accessToken = res.accessToken;

      this.coinbaseProvider.buyPrice(
        accessToken,
        this.coinbaseProvider.getAvailableCurrency(),
        (err, b) => {
          if (err) this.logger.error(err);
          this.buyPrice = b.data || null;
        }
      );

      this.paymentMethods = [];
      this.selectedPaymentMethodId = null;
      this.coinbaseProvider.getPaymentMethods(accessToken, (err, p) => {
        if (err) {
          this.onGoingProcessProvider.clear();
          this.showErrorAndBack(err);
          return;
        }

        let hasPrimary;
        let pm;
        for (let i = 0; i < p.data.length; i++) {
          pm = p.data[i];
          if (pm.allow_buy) {
            this.paymentMethods.push(pm);
          }
          if (pm.allow_buy && pm.primary_buy) {
            hasPrimary = true;
            this.selectedPaymentMethodId = pm.id;
          }
        }
        if (_.isEmpty(this.paymentMethods)) {
          this.onGoingProcessProvider.clear();
          let url =
            'https://support.coinbase.com/customer/portal/articles/1148716-payment-methods-for-us-customers';
          let msg = 'No payment method available to buy';
          let okText = 'More info';
          let cancelText = 'Go Back';
          this.popupProvider
            .ionicConfirm(null, msg, okText, cancelText)
            .then(res => {
              if (res) this.externalLinkProvider.open(url);
              this.navCtrl.pop();
            });
          return;
        }
        if (!hasPrimary)
          this.selectedPaymentMethodId = this.paymentMethods[0].id;
        this.buyRequest();
      });
    });
  }

  public buyRequest(): void {
    this.coinbaseProvider.init((err, res) => {
      if (err) {
        this.onGoingProcessProvider.clear();
        this.showErrorAndBack(err);
        return;
      }
      let accessToken = res.accessToken;
      let accountId = res.accountId;
      let dataSrc = {
        amount: this.amount,
        currency: this.currency,
        payment_method: this.selectedPaymentMethodId,
        quote: true
      };
      this.coinbaseProvider.buyRequest(
        accessToken,
        accountId,
        dataSrc,
        (err, data) => {
          this.onGoingProcessProvider.clear();
          if (err) {
            this.showErrorAndBack(err);
            return;
          }
          this.buyRequestInfo = data.data;
        }
      );
    });
  }

  public buyConfirm() {
    let message = 'Buy bitcoin for ' + this.amountUnitStr;
    let okText = 'Confirm';
    let cancelText = 'Cancel';
    this.popupProvider
      .ionicConfirm(null, message, okText, cancelText)
      .then((ok: boolean) => {
        if (!ok) {
          if (this.isCordova) this.slideButton.isConfirmed(false);
          return;
        }

        this.onGoingProcessProvider.set('buyingBitcoin');
        this.coinbaseProvider.init((err, res) => {
          if (err) {
            this.onGoingProcessProvider.clear();
            this.showError(this.coinbaseProvider.getErrorsAsString(err));
            return;
          }
          let accessToken = res.accessToken;
          let accountId = res.accountId;
          let dataSrc = {
            amount: this.amount,
            currency: this.currency,
            payment_method: this.selectedPaymentMethodId,
            commit: true
          };
          this.coinbaseProvider.buyRequest(
            accessToken,
            accountId,
            dataSrc,
            (err, b) => {
              if (err) {
                this.onGoingProcessProvider.clear();
                this.showError(this.coinbaseProvider.getErrorsAsString(err));
                return;
              }
              setTimeout(() => {
                let tx = b.data ? b.data.transaction : null;
                if (tx && tx.id) {
                  this.processBuyTx(tx, accessToken, accountId);
                } else {
                  this._processBuyOrder(b, accessToken, accountId);
                }
              }, 10000);
            }
          );
        });
      });
  }

  private processBuyTx(tx, accessToken, accountId): void {
    if (!tx) {
      this.onGoingProcessProvider.clear();
      this.showError('Transaction not found');
      return;
    }

    this.coinbaseProvider.getTransaction(
      accessToken,
      accountId,
      tx.id,
      (err, updatedTx) => {
        if (err) {
          this.onGoingProcessProvider.clear();
          this.showError(this.coinbaseProvider.getErrorsAsString(err));
          return;
        }
        this.walletProvider
          .getAddress(this.wallet, false)
          .then((walletAddr: string) => {
            updatedTx.data['toAddr'] = walletAddr;
            updatedTx.data['status'] = 'pending'; // Forcing "pending" status to process later

            this.logger.debug('Saving transaction to process later...');
            this.coinbaseProvider.savePendingTransaction(
              updatedTx.data,
              {},
              err => {
                this.onGoingProcessProvider.clear();
                if (err) this.logger.warn(err);
                this.openFinishModal();
              }
            );
          })
          .catch(err => {
            this.onGoingProcessProvider.clear();
            this.showError(err);
          });
      }
    );
  }

  private _processBuyOrder(b, accessToken, accountId): void {
    this.coinbaseProvider.getBuyOrder(
      accessToken,
      accountId,
      b.data.id,
      (err, buyResp) => {
        if (err) {
          this.onGoingProcessProvider.clear();
          this.showError(this.coinbaseProvider.getErrorsAsString(err));
          return;
        }
        let tx = buyResp.data ? buyResp.data.transaction : null;
        if (tx && tx.id) {
          this.processBuyTx(tx, accessToken, accountId);
        } else {
          setTimeout(() => {
            this._processBuyOrder(b, accessToken, accountId);
          }, 10000);
        }
      }
    );
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

  public onWalletSelect(wallet) {
    this.wallet = wallet;
    let parsedAmount = this.txFormatProvider.parseAmount(
      this.coin,
      this.amount,
      this.currency
    );

    // Buy always in BTC
    this.amount = (parsedAmount.amountSat / 100000000).toFixed(8);
    this.currency = 'BTC';

    this.amountUnitStr = parsedAmount.amountUnitStr;
    this.onGoingProcessProvider.set('calculatingFee');
    this.coinbaseProvider.checkEnoughFundsForFee(this.amount, err => {
      this.onGoingProcessProvider.clear();
      if (err) {
        this.showErrorAndBack(err);
        return;
      }
      this.processPaymentInfo();
    });
  }

  private openFinishModal(): void {
    let finishText = 'Bought';
    let finishComment =
      'Bitcoin purchase completed. Coinbase has queued the transfer to your selected wallet';
    let modal = this.modalCtrl.create(
      FinishModalPage,
      { finishText, finishComment },
      { showBackdrop: true, enableBackdropDismiss: false }
    );
    modal.present();
    modal.onDidDismiss(async () => {
      await this.navCtrl.popToRoot({ animate: false });
      await this.navCtrl.push(
        CoinbasePage,
        { coin: 'btc' },
        { animate: false }
      );
    });
  }
}
