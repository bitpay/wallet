import { Component } from '@angular/core';
import {
  Events,
  ModalController,
  NavController,
  NavParams
} from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../../providers/logger/logger';

//providers
import { CoinbaseProvider } from '../../../../providers/coinbase/coinbase';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { TxFormatProvider } from '../../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../../providers/wallet/wallet';

//pages
import { SuccessModalPage } from '../../../success/success';
import { CoinbasePage } from '../coinbase';

@Component({
  selector: 'page-buy-coinbase',
  templateUrl: 'buy-coinbase.html'
})
export class BuyCoinbasePage {
  private amount: string;
  private currency: string;
  private coin: string;
  private wallets: any;

  public paymentMethods: any[];
  public selectedPaymentMethodId: any;
  public buyPrice: string;
  public buyRequestInfo: any;
  public amountUnitStr: string;
  public accessToken: string;
  public accountId: string;
  public wallet: any;
  public network: string;
  public isFiat: boolean;

  constructor(
    private coinbaseProvider: CoinbaseProvider,
    private logger: Logger,
    private popupProvider: PopupProvider,
    private navCtrl: NavController,
    private events: Events,
    private externalLinkProvider: ExternalLinkProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private navParams: NavParams,
    private walletProvider: WalletProvider,
    private txFormatProvider: TxFormatProvider,
    private profileProvider: ProfileProvider,
    private modalCtrl: ModalController
  ) {
    this.coin = 'btc';
    this.isFiat = this.navParams.data.currency != 'BTC' ? true : false;
    this.amount = this.navParams.data.amount;
    this.currency = this.navParams.data.currency;
    this.network = this.coinbaseProvider.getNetwork();
  }

  public ionViewDidLoad() {
    this.logger.info('ionViewDidLoad BuyCoinbasePage');
  }

  public ionViewWillEnter() {
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

  private showErrorAndBack(err: any): void {
    this.logger.error(err);
    err = err.errors ? err.errors[0].message : err;
    this.popupProvider.ionicAlert('Error', err).then(() => {
      this.navCtrl.pop();
    });
  }

  private showError(err: any): void {
    this.logger.error(err);
    err = err.errors ? err.errors[0].message : err;
    this.popupProvider.ionicAlert('Error', err);
  }

  private processPaymentInfo(): void {
    this.onGoingProcessProvider.set('connectingCoinbase', true);
    this.coinbaseProvider.init((err: any, res: any) => {
      if (err) {
        this.onGoingProcessProvider.set('connectingCoinbase', false);
        this.showErrorAndBack(err);
        return;
      }
      const accessToken = res.accessToken;

      this.coinbaseProvider.buyPrice(
        accessToken,
        this.coinbaseProvider.getAvailableCurrency(),
        (err: any, b: any) => {
          this.buyPrice = b.data || null;
        }
      );

      this.paymentMethods = [];
      this.selectedPaymentMethodId = null;
      this.coinbaseProvider.getPaymentMethods(
        accessToken,
        (err: any, p: any) => {
          if (err) {
            this.onGoingProcessProvider.set('connectingCoinbase', false);
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
            this.onGoingProcessProvider.set('connectingCoinbase', false);
            const url =
              'https://support.coinbase.com/customer/portal/articles/1148716-payment-methods-for-us-customers';
            const msg = 'No payment method available to buy';
            const okText = 'More info';
            const cancelText = 'Go Back';
            this.popupProvider
              .ionicConfirm(null, msg, okText, cancelText)
              .then(res => {
                if (res) {
                  this.externalLinkProvider.open(url);
                }
                this.navCtrl.remove(3, 1);
                this.navCtrl.pop();
              });
            return;
          }
          if (!hasPrimary) {
            this.selectedPaymentMethodId = this.paymentMethods[0].id;
          }
          this.buyRequest();
        }
      );
    });
  }

  public buyRequest(): void {
    this.onGoingProcessProvider.set('connectingCoinbase', true);
    this.coinbaseProvider.init((err, res) => {
      if (err) {
        this.onGoingProcessProvider.set('connectingCoinbase', false);
        this.showErrorAndBack(err);
        return;
      }
      const accessToken = res.accessToken;
      const accountId = res.accountId;
      const dataSrc = {
        amount: this.amount,
        currency: this.currency,
        payment_method: this.selectedPaymentMethodId,
        quote: true
      };
      this.coinbaseProvider.buyRequest(
        accessToken,
        accountId,
        dataSrc,
        (err: any, data: any) => {
          this.onGoingProcessProvider.set('connectingCoinbase', false);
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
    const message = 'Buy bitcoin for ' + this.amountUnitStr;
    const okText = 'Confirm';
    const cancelText = 'Cancel';
    this.popupProvider
      .ionicConfirm(null, message, okText, cancelText)
      .then((ok: boolean) => {
        if (!ok) {
          return;
        }

        this.onGoingProcessProvider.set('buyingBitcoin', true);
        this.coinbaseProvider.init((err: any, res: any) => {
          if (err) {
            this.onGoingProcessProvider.set('buyingBitcoin', false);
            this.showError(err);
            return;
          }
          const accessToken = res.accessToken;
          const accountId = res.accountId;
          const dataSrc = {
            amount: this.amount,
            currency: this.currency,
            payment_method: this.selectedPaymentMethodId,
            commit: true
          };
          this.coinbaseProvider.buyRequest(
            accessToken,
            accountId,
            dataSrc,
            (err: any, b: any) => {
              if (err) {
                this.onGoingProcessProvider.set('buyingBitcoin', false);
                this.showError(err);
                return;
              }
              setTimeout(() => {
                const tx = b.data ? b.data.transaction : null;
                if (tx && tx.id) {
                  this.processBuyTx(tx);
                } else {
                  this._processBuyOrder(b);
                }
              }, 8000);
            }
          );
        });
      });
  }

  private processBuyTx(tx: any): void {
    if (!tx) {
      this.onGoingProcessProvider.set('buyingBitcoin', false);
      this.showError('Transaction not found');
      return;
    }

    this.coinbaseProvider.getTransaction(
      this.accessToken,
      this.accountId,
      tx.id,
      (err: any, updatedTx: any) => {
        if (err) {
          this.onGoingProcessProvider.set('buyingBitcoin', false);
          this.showError(err);
          return;
        }
        this.walletProvider
          .getAddress(this.wallet, false)
          .then((walletAddr: string) => {
            updatedTx.data.toAddr = walletAddr;
            updatedTx.data.status = 'pending'; // Forcing "pending" status to process later

            this.logger.debug('Saving transaction to process later...');
            this.coinbaseProvider.savePendingTransaction(
              updatedTx.data,
              {},
              (err: any) => {
                this.onGoingProcessProvider.set('buyingBitcoin', false);
                if (err) {
                  this.logger.debug(err);
                }
                this.openSuccessModal();
              }
            );
          })
          .catch(err => {
            this.onGoingProcessProvider.set('buyingBitcoin', false);
            this.showError(err);
          });
      }
    );
  }

  private _processBuyOrder(b: any): void {
    this.coinbaseProvider.getBuyOrder(
      this.accessToken,
      this.accountId,
      b.data.id,
      (err: any, buyResp: any) => {
        if (err) {
          this.onGoingProcessProvider.set('buyingBitcoin', false);
          this.showError(err);
          return;
        }
        const tx = buyResp.data ? buyResp.data.transaction : null;
        if (tx && tx.id) {
          this.processBuyTx(tx);
        } else {
          setTimeout(() => {
            this._processBuyOrder(b);
          }, 5000);
        }
      }
    );
  }

  public showWallets(): void {
    const id = this.wallet ? this.wallet.credentials.walletId : null;
    this.events.publish(
      'showWalletsSelectorEvent',
      this.wallets,
      id,
      'Receive in'
    );
    this.events.subscribe('selectWalletEvent', (wallet: any) => {
      if (!_.isEmpty(wallet)) {
        this.onWalletSelect(wallet);
      }
      this.events.unsubscribe('selectWalletEvent');
    });
  }

  public onWalletSelect(wallet: any) {
    this.wallet = wallet;
    const parsedAmount = this.txFormatProvider.parseAmount(
      this.coin,
      this.amount,
      this.currency
    );

    // Buy always in BTC
    this.amount = (parsedAmount.amountSat / 100000000).toFixed(8);
    this.currency = 'BTC';

    this.amountUnitStr = parsedAmount.amountUnitStr;
    this.onGoingProcessProvider.set('calculatingFee', true);
    this.coinbaseProvider.checkEnoughFundsForFee(this.amount, (err: any) => {
      this.onGoingProcessProvider.set('calculatingFee', false);
      if (err) {
        this.showErrorAndBack(err);
        return;
      }
      this.processPaymentInfo();
    });
  }

  public openSuccessModal(): void {
    const successText = 'Bought';
    const successComment =
      'Bitcoin purchase completed. Coinbase has queued the transfer to your selected wallet';
    const modal = this.modalCtrl.create(
      SuccessModalPage,
      { successText, successComment },
      { showBackdrop: true, enableBackdropDismiss: false }
    );
    modal.present();
    modal.onDidDismiss(() => {
      this.navCtrl.remove(3, 1);
      this.navCtrl.pop();
      this.navCtrl.push(CoinbasePage, { coin: 'btc' });
    });
  }
}
