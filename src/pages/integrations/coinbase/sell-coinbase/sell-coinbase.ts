import { Component } from '@angular/core';
import { Events, ModalController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../../providers/logger/logger';

//pages
import { SuccessModalPage } from '../../../success/success';
import { CoinbasePage } from '../coinbase';

//providers
import { AppProvider } from '../../../../providers/app/app';
import { CoinbaseProvider } from '../../../../providers/coinbase/coinbase';
import { ConfigProvider } from '../../../../providers/config/config';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { TxFormatProvider } from '../../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../../providers/wallet/wallet';

@Component({
  selector: 'page-sell-coinbase',
  templateUrl: 'sell-coinbase.html',
})
export class SellCoinbasePage {

  private coin: string;
  private amount: string;
  private currency: string;
  private wallets: any;

  public paymentMethods: Array<any>;
  public selectedPaymentMethodId: any;
  public selectedPriceSensitivity: any;
  public sellPrice: string;
  public amountUnitStr: string;
  public accountId: string;
  public wallet: any;
  public sellRequestInfo: any;
  public network: string;
  public isFiat: boolean;
  public priceSensitivity: any;

  constructor(
    private appProvider: AppProvider,
    private coinbaseProvider: CoinbaseProvider,
    private configProvider: ConfigProvider,
    private events: Events,
    private logger: Logger,
    private popupProvider: PopupProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private externalLinkProvider: ExternalLinkProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private walletProvider: WalletProvider,
    private txFormatProvider: TxFormatProvider,
    private profileProvider: ProfileProvider,
    private modalCtrl: ModalController
  ) {
    this.coin = 'btc';
    this.isFiat = this.navParams.data.currency != 'BTC' ? true : false;
    this.amount = this.navParams.data.amount;
    this.currency = this.navParams.data.currency;
    this.priceSensitivity = this.coinbaseProvider.priceSensitivity;
    this.selectedPriceSensitivity = { data: this.coinbaseProvider.selectedPriceSensitivity };
    this.network = this.coinbaseProvider.getNetwork();
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad SellCoinbasePage');
  }

  ionViewWillEnter() {
    this.wallets = this.profileProvider.getWallets({
      m: 1, // Only 1-signature wallet
      onlyComplete: true,
      network: this.network,
      hasFunds: true,
      coin: this.coin
    });

    if (_.isEmpty(this.wallets)) {
      this.showErrorAndBack('No wallet available to operate with Coinbase');
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

  private publishAndSign(wallet: any, txp: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
        let err = 'No signing proposal: No private key';
        this.logger.info(err);
        return reject(err);
      }

      this.walletProvider.publishAndSign(wallet, txp).then((txp: any) => {
        return resolve(txp);
      }).catch((err: any) => {
        return reject(err);
      });
    });
  }

  private processPaymentInfo(): void {
    this.onGoingProcessProvider.set('connectingCoinbase', true);
    this.coinbaseProvider.init((err: any, res: any) => {
      if (err) {
        this.onGoingProcessProvider.set('connectingCoinbase', false);
        this.showErrorAndBack(this.coinbaseProvider.getErrorsAsString(err.errors));
        return;
      }
      let accessToken = res.accessToken;

      this.coinbaseProvider.sellPrice(accessToken, this.coinbaseProvider.getAvailableCurrency(), (err: any, s: any) => {
        this.sellPrice = s.data || null;
      });

      this.paymentMethods = [];
      this.selectedPaymentMethodId = null;
      this.coinbaseProvider.getPaymentMethods(accessToken, (err: any, p: any) => {
        if (err) {
          this.onGoingProcessProvider.set('connectingCoinbase', false);
          this.showErrorAndBack(this.coinbaseProvider.getErrorsAsString(err.errors));
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
          let url = 'https://support.coinbase.com/customer/portal/articles/1148716-payment-methods-for-us-customers';
          let msg = 'No payment method available to buy';
          let okText = 'More info';
          let cancelText = 'Go Back';
          this.popupProvider.ionicConfirm(null, msg, okText, cancelText).then((res) => {
            if (res) this.externalLinkProvider.open(url);
            this.navCtrl.remove(3, 1);
            this.navCtrl.pop();
          });
          return;
        }
        if (!hasPrimary) this.selectedPaymentMethodId = this.paymentMethods[0].id;
        this.sellRequest();
      });
    });
  }

  private checkTransaction = _.throttle((count: number, txp: any) => {
    this.logger.warn('Check if transaction has been received by Coinbase. Try ' + count + '/5');
    // TX amount in BTC
    let satToBtc = 1 / 100000000;
    let amountBTC = (txp.amount * satToBtc).toFixed(8);
    this.coinbaseProvider.init((err: any, res: any) => {
      if (err) {
        this.logger.error(err);
        this.checkTransaction(count, txp);
        return;
      }
      let accessToken = res.accessToken;
      let accountId = res.accountId;
      let sellPrice = null;

      this.coinbaseProvider.sellPrice(accessToken, this.coinbaseProvider.getAvailableCurrency(), (err: any, sell: any) => {
        if (err) {
          this.logger.debug(this.coinbaseProvider.getErrorsAsString(err.errors));
          this.checkTransaction(count, txp);
          return;
        }
        sellPrice = sell.data;

        this.coinbaseProvider.getTransactions(accessToken, accountId, (err: any, ctxs: any) => {
          if (err) {
            this.logger.debug(this.coinbaseProvider.getErrorsAsString(err.errors));
            this.checkTransaction(count, txp);
            return;
          }

          let coinbaseTransactions = ctxs.data;
          let txFound = false;
          let ctx;
          for (let i = 0; i < coinbaseTransactions.length; i++) {
            ctx = coinbaseTransactions[i];
            if (ctx.type == 'send' && ctx.from && ctx.amount.amount == amountBTC) {
              this.logger.warn('Transaction found!', ctx);
              txFound = true;
              this.logger.debug('Saving transaction to process later...');
              ctx.payment_method = this.selectedPaymentMethodId;
              ctx.status = 'pending'; // Forcing "pending" status to process later
              ctx.price_sensitivity = this.selectedPriceSensitivity;
              ctx.sell_price_amount = sellPrice ? sellPrice.amount : '';
              ctx.sell_price_currency = sellPrice ? sellPrice.currency : 'USD';
              ctx.description = this.appProvider.info.nameCase + ' Wallet: ' + this.wallet.name;
              this.coinbaseProvider.savePendingTransaction(ctx, null, (err: any) => {
                this.onGoingProcessProvider.set('sellingBitcoin', false);
                this.openSuccessModal();
                if (err) this.logger.debug(this.coinbaseProvider.getErrorsAsString(err.errors));
              });
              return;
            }
          }
          if (!txFound) {
            // Transaction sent, but could not be verified by Coinbase.com
            this.logger.warn('Transaction not found in Coinbase. Will try 5 times...');
            if (count < 5) {
              this.checkTransaction(count + 1, txp);
            } else {
              this.onGoingProcessProvider.set('sellingBitcoin', false);
              this.showError('No transaction found');
              return;
            }
          }
        });
      });
    });
  }, 8000, {
      'leading': true
    });

  public sellRequest(): void {
    this.onGoingProcessProvider.set('connectingCoinbase', true);
    this.coinbaseProvider.init((err: any, res: any) => {
      if (err) {
        this.onGoingProcessProvider.set('connectingCoinbase', false);
        this.showErrorAndBack(this.coinbaseProvider.getErrorsAsString(err.errors));
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
      this.coinbaseProvider.sellRequest(accessToken, accountId, dataSrc, (err: any, data: any) => {
        this.onGoingProcessProvider.set('connectingCoinbase', false);
        if (err) {
          this.showErrorAndBack(this.coinbaseProvider.getErrorsAsString(err.errors));
          return;
        }
        this.sellRequestInfo = data.data;
      });
    });
  }

  public sellConfirm(): void {
    let config = this.configProvider.get();
    let configWallet = config.wallet;
    let walletSettings = configWallet.settings;

    let message = 'Selling bitcoin for ' + this.amount + ' ' + this.currency;
    let okText = 'Confirm';
    let cancelText = 'Cancel';
    this.popupProvider.ionicConfirm(null, message, okText, cancelText).then((ok: any) => {
      if (!ok) return;

      this.onGoingProcessProvider.set('sellingBitcoin', true);
      this.coinbaseProvider.init((err: any, res: any) => {
        if (err) {
          this.onGoingProcessProvider.set('sellingBitcoin', false);
          this.showError(this.coinbaseProvider.getErrorsAsString(err.errors));
          return;
        }
        let accessToken = res.accessToken;
        let accountId = res.accountId;

        let dataSrc = {
          name: 'Received from ' + this.appProvider.info.nameCase
        };
        this.coinbaseProvider.createAddress(accessToken, accountId, dataSrc, (err: any, data: any) => {
          if (err) {
            this.onGoingProcessProvider.set('sellingBitcoin', false);
            this.showError(this.coinbaseProvider.getErrorsAsString(err.errors));
            return;
          }
          let outputs = [];
          let toAddress = data.data.address;
          let amountSat = parseInt((this.sellRequestInfo.amount.amount * 100000000).toFixed(0), 10);
          let comment = 'Sell bitcoin (Coinbase)';

          outputs.push({
            'toAddress': toAddress,
            'amount': amountSat,
            'message': comment
          });

          let txp = {
            toAddress: toAddress,
            amount: amountSat,
            outputs: outputs,
            message: comment,
            payProUrl: null,
            excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
            feeLevel: walletSettings.feeLevel || 'normal'
          };

          this.walletProvider.createTx(this.wallet, txp).then((ctxp: any) => {
            this.logger.debug('Transaction created.');
            this.publishAndSign(this.wallet, ctxp).then((txSent: any) => {
              this.logger.debug('Transaction broadcasted. Wait for Coinbase confirmation...');
              this.checkTransaction(1, txSent);
            }).catch((err: any) => {
              this.onGoingProcessProvider.set('sellingBitcoin', false);
              this.showError(err);
              return;
            });
          }).catch((err: any) => {
            this.onGoingProcessProvider.set('sellingBitcoin', false);
            this.showError(err);
            return;
          });
        });
      });
    });
  }

  public showWallets(): void {
    let id = this.wallet ? this.wallet.credentials.walletId : null;
    this.events.publish('showWalletsSelectorEvent', this.wallets, id, 'Sell from');
    this.events.subscribe('selectWalletEvent', (wallet: any) => {
      if (!_.isEmpty(wallet)) this.onWalletSelect(wallet);
      this.events.unsubscribe('selectWalletEvent');
    });
  }

  public onWalletSelect(wallet: any): void {
    this.wallet = wallet;
    let parsedAmount = this.txFormatProvider.parseAmount(this.coin, this.amount, this.currency);

    this.amount = parsedAmount.amount;
    this.currency = parsedAmount.currency;
    this.amountUnitStr = parsedAmount.amountUnitStr;
    this.processPaymentInfo();
  }

  public openSuccessModal(): void {
    let successText = 'Funds sent to Coinbase Account';
    let successComment = 'The transaction is not yet confirmed, and will show as "Pending" in your Activity. The bitcoin sale will be completed automatically once it is confirmed by Coinbase';
    let modal = this.modalCtrl.create(SuccessModalPage, { successText: successText, successComment: successComment }, { showBackdrop: true, enableBackdropDismiss: false });
    modal.present();
    modal.onDidDismiss(() => {
      this.navCtrl.remove(3, 1);
      this.navCtrl.pop();
      this.navCtrl.push(CoinbasePage, { coin: 'btc' });
    });
  }

}
