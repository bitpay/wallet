import { Component, ViewChild } from '@angular/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../../providers/logger/logger';

// pages
import { FinishModalPage } from '../../../finish/finish';
import { CoinbasePage } from '../coinbase';

// providers
import { ActionSheetProvider } from '../../../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../../../providers/app/app';
import { BwcErrorProvider } from '../../../../providers/bwc-error/bwc-error';
import { CoinbaseProvider } from '../../../../providers/coinbase/coinbase';
import { ConfigProvider } from '../../../../providers/config/config';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../../providers/platform/platform';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { TxFormatProvider } from '../../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../../providers/wallet/wallet';

@Component({
  selector: 'page-sell-coinbase',
  templateUrl: 'sell-coinbase.html'
})
export class SellCoinbasePage {
  @ViewChild('slideButton') slideButton;

  private coin: string;
  private amount: string;
  private currency: string;
  private wallets;

  public paymentMethods;
  public selectedPaymentMethodId;
  public selectedPriceSensitivity;
  public sellPrice: string;
  public amountUnitStr: string;
  public accountId: string;
  public wallet;
  public sellRequestInfo;
  public network: string;
  public isFiat: boolean;
  public priceSensitivity;
  public isOpenSelector: boolean;

  // Platform info
  public isCordova: boolean;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private appProvider: AppProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private coinbaseProvider: CoinbaseProvider,
    private configProvider: ConfigProvider,
    private logger: Logger,
    private popupProvider: PopupProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private externalLinkProvider: ExternalLinkProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
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
    this.priceSensitivity = this.coinbaseProvider.priceSensitivity;
    this.selectedPriceSensitivity = {
      data: this.coinbaseProvider.selectedPriceSensitivity
    };
    this.network = this.coinbaseProvider.getNetwork();
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad SellCoinbasePage');
  }

  ionViewWillLeave() {
    this.navCtrl.swipeBackEnabled = true;
  }

  ionViewWillEnter() {
    this.isOpenSelector = false;
    this.navCtrl.swipeBackEnabled = false;
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

  private publishAndSign(wallet, txp): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
        let err = 'No signing proposal: No private key';
        return reject(err);
      }
      this.walletProvider
        .publishAndSign(wallet, txp)
        .then(txp => {
          this.onGoingProcessProvider.clear();
          return resolve(txp);
        })
        .catch(err => {
          this.onGoingProcessProvider.clear();
          return reject(err);
        });
    });
  }

  private processPaymentInfo(): void {
    this.onGoingProcessProvider.set('connectingCoinbase');
    this.coinbaseProvider.init((err, res) => {
      if (err) {
        this.onGoingProcessProvider.clear();
        this.showErrorAndBack(this.coinbaseProvider.getErrorsAsString(err));
        return;
      }
      let accessToken = res.accessToken;

      this.coinbaseProvider.sellPrice(
        accessToken,
        this.coinbaseProvider.getAvailableCurrency(),
        (_, s) => {
          this.sellPrice = s.data || null;
        }
      );

      this.paymentMethods = [];
      this.selectedPaymentMethodId = null;
      this.coinbaseProvider.getPaymentMethods(accessToken, (err, p) => {
        if (err) {
          this.onGoingProcessProvider.clear();
          this.showErrorAndBack(this.coinbaseProvider.getErrorsAsString(err));
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
              this.navCtrl.remove(3, 1);
              this.navCtrl.pop();
            });
          return;
        }
        if (!hasPrimary)
          this.selectedPaymentMethodId = this.paymentMethods[0].id;
        this.sellRequest();
      });
    });
  }

  private checkTransaction = _.throttle(
    (count: number, txp) => {
      this.logger.warn(
        'Check if transaction has been received by Coinbase. Try ' +
          count +
          '/5'
      );
      // TX amount in BTC
      let satToBtc = 1 / 100000000;
      let amountBTC = (txp.amount * satToBtc).toFixed(8);
      this.coinbaseProvider.init((err, res) => {
        if (err) {
          this.logger.error(err);
          this.checkTransaction(count, txp);
          return;
        }
        let accessToken = res.accessToken;
        let accountId = res.accountId;
        let sellPrice = null;

        this.coinbaseProvider.sellPrice(
          accessToken,
          this.coinbaseProvider.getAvailableCurrency(),
          (err, sell) => {
            if (err) {
              this.logger.debug(this.coinbaseProvider.getErrorsAsString(err));
              this.checkTransaction(count, txp);
              return;
            }
            sellPrice = sell.data;

            this.coinbaseProvider.getTransactions(
              accessToken,
              accountId,
              (err, ctxs) => {
                if (err) {
                  this.logger.debug(
                    this.coinbaseProvider.getErrorsAsString(err)
                  );
                  this.checkTransaction(count, txp);
                  return;
                }

                let coinbaseTransactions = ctxs.data;
                let txFound = false;
                let ctx;
                for (let i = 0; i < coinbaseTransactions.length; i++) {
                  ctx = coinbaseTransactions[i];
                  if (
                    ctx.type == 'send' &&
                    ctx.from &&
                    ctx.amount.amount == amountBTC
                  ) {
                    this.logger.warn('Transaction found!', ctx);
                    txFound = true;
                    this.logger.debug('Saving transaction to process later...');
                    ctx.payment_method = this.selectedPaymentMethodId;
                    ctx.status = 'pending'; // Forcing "pending" status to process later
                    ctx.price_sensitivity = this.selectedPriceSensitivity;
                    ctx.sell_price_amount = sellPrice ? sellPrice.amount : '';
                    ctx.sell_price_currency = sellPrice
                      ? sellPrice.currency
                      : 'USD';
                    ctx.description =
                      this.appProvider.info.nameCase +
                      ' Wallet: ' +
                      this.wallet.name;
                    this.coinbaseProvider.savePendingTransaction(
                      ctx,
                      null,
                      err => {
                        this.onGoingProcessProvider.clear();
                        this.openFinishModal();
                        if (err)
                          this.logger.debug(
                            this.coinbaseProvider.getErrorsAsString(err)
                          );
                      }
                    );
                    return;
                  }
                }
                if (!txFound) {
                  // Transaction sent, but could not be verified by Coinbase.com
                  this.logger.warn(
                    'Transaction not found in Coinbase. Will try 5 times...'
                  );
                  if (count < 5) {
                    this.checkTransaction(count + 1, txp);
                  } else {
                    this.onGoingProcessProvider.clear();
                    this.showError('No transaction found');
                    return;
                  }
                }
              }
            );
          }
        );
      });
    },
    8000,
    {
      leading: true
    }
  );

  public sellRequest(): void {
    this.coinbaseProvider.init((err, res) => {
      if (err) {
        this.onGoingProcessProvider.clear();
        this.showErrorAndBack(this.coinbaseProvider.getErrorsAsString(err));
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
      this.coinbaseProvider.sellRequest(
        accessToken,
        accountId,
        dataSrc,
        (err, data) => {
          this.onGoingProcessProvider.clear();
          if (err) {
            this.showErrorAndBack(this.coinbaseProvider.getErrorsAsString(err));
            return;
          }
          this.sellRequestInfo = data.data;
        }
      );
    });
  }

  public sellConfirm(): void {
    let config = this.configProvider.get();
    let configWallet = config.wallet;
    let walletSettings = configWallet.settings;

    let message = 'Selling bitcoin for ' + this.amount + ' ' + this.currency;
    let okText = 'Confirm';
    let cancelText = 'Cancel';
    this.popupProvider
      .ionicConfirm(null, message, okText, cancelText)
      .then(ok => {
        if (!ok) {
          if (this.isCordova) this.slideButton.isConfirmed(false);
          return;
        }

        this.onGoingProcessProvider.set('sellingBitcoin');
        this.coinbaseProvider.init((err, res) => {
          if (err) {
            this.onGoingProcessProvider.clear();
            this.showError(this.coinbaseProvider.getErrorsAsString(err));
            return;
          }
          let accessToken = res.accessToken;
          let accountId = res.accountId;

          let dataSrc = {
            name: 'Received from ' + this.appProvider.info.nameCase
          };
          this.coinbaseProvider.createAddress(
            accessToken,
            accountId,
            dataSrc,
            (err, data) => {
              if (err) {
                this.onGoingProcessProvider.clear();
                this.showError(this.coinbaseProvider.getErrorsAsString(err));
                return;
              }
              let outputs = [];
              let toAddress = data.data.address;
              let amountSat = parseInt(
                (this.sellRequestInfo.amount.amount * 100000000).toFixed(0),
                10
              );
              let comment = 'Sell bitcoin (Coinbase)';

              outputs.push({
                toAddress,
                amount: amountSat,
                message: comment
              });

              let txp = {
                toAddress,
                amount: amountSat,
                outputs,
                message: comment,
                payProUrl: null,
                excludeUnconfirmedUtxos: configWallet.spendUnconfirmed
                  ? false
                  : true,
                feeLevel: walletSettings.feeLevel || 'normal'
              };

              this.walletProvider
                .createTx(this.wallet, txp)
                .then(ctxp => {
                  this.logger.debug('Transaction created.');
                  this.publishAndSign(this.wallet, ctxp)
                    .then(txSent => {
                      this.logger.debug(
                        'Transaction broadcasted. Wait for Coinbase confirmation...'
                      );
                      this.checkTransaction(1, txSent);
                    })
                    .catch(err => {
                      this.onGoingProcessProvider.clear();
                      this.showError(this.bwcErrorProvider.msg(err));
                      return;
                    });
                })
                .catch(err => {
                  this.onGoingProcessProvider.clear();
                  this.showError(err);
                  return;
                });
            }
          );
        });
      });
  }

  public showWallets(): void {
    this.isOpenSelector = true;
    let id = this.wallet ? this.wallet.credentials.walletId : null;
    const params = {
      wallets: this.wallets,
      selectedWalletId: id,
      title: 'Sell from'
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
    let finishText = 'Funds sent to Coinbase Account';
    let finishComment =
      'The transaction is not yet confirmed, and will show as "Pending" in your Activity. The bitcoin sale will be completed automatically once it is confirmed by Coinbase';
    let modal = this.modalCtrl.create(
      FinishModalPage,
      { finishText, finishComment },
      { showBackdrop: true, enableBackdropDismiss: false }
    );
    modal.present();
    modal.onDidDismiss(async () => {
      await this.navCtrl.popToRoot({ animate: false });
      await this.navCtrl.parent.select(0);
      await this.navCtrl.push(
        CoinbasePage,
        { coin: 'btc' },
        { animate: false }
      );
    });
  }
}
