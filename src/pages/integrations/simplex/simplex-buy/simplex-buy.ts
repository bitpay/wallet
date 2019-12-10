import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';

// Proviers
import { ActionSheetProvider } from '../../../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../../../providers/app/app';
import { CurrencyProvider } from '../../../../providers/currency/currency';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { Logger } from '../../../../providers/logger/logger';
import { PersistenceProvider } from '../../../../providers/persistence/persistence';
import { PlatformProvider } from '../../../../providers/platform/platform';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { RateProvider } from '../../../../providers/rate/rate';
import { SimplexProvider } from '../../../../providers/simplex/simplex';
import { WalletProvider } from '../../../../providers/wallet/wallet';

@Component({
  selector: 'page-simplex-buy',
  templateUrl: 'simplex-buy.html'
})
export class SimplexBuyPage {
  public isOpenSelector: boolean;
  public wallet;
  public wallets: any[];
  public quoteForm: FormGroup;
  public cryptoAmount: number;
  public fiatBaseAmount: number;
  public fiatTotalAmount: number;
  public fiatCurrency: string;
  public okText: string;
  public cancelText: string;
  public validUntil: string;
  public showLoading: boolean;
  public minFiatAmount: number;
  public maxFiatAmount: number;
  public supportedFiatAltCurrencies: string[];

  private quoteId: string;
  private createdOn: string;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private appProvider: AppProvider,
    private currencyProvider: CurrencyProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private fb: FormBuilder,
    private logger: Logger,
    private navCtrl: NavController,
    private persistenceProvider: PersistenceProvider,
    private platformProvider: PlatformProvider,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider,
    private rateProvider: RateProvider,
    private simplexProvider: SimplexProvider,
    private translate: TranslateService,
    private walletProvider: WalletProvider
  ) {
    this.quoteForm = this.fb.group({
      amount: [
        120,
        [Validators.required, Validators.min(50), Validators.max(20000)]
      ],
      altCurrency: ['USD', [Validators.required]]
    });

    this.persistenceProvider.getProfile().then(profile => {
      this.createdOn =
        profile && profile.createdOn
          ? moment(profile.createdOn).format('YYYY-MM-DDTHH:mm:ss.SSSZ')
          : moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SimplexBuyPage');
  }

  ionViewDidEnter() {
    this.wallets = this.profileProvider.getWallets({
      network: 'livenet',
      onlyComplete: true,
      coin: ['btc'],
      backedUp: true
    });
    this.supportedFiatAltCurrencies = ['USD', 'EUR'];
    this.okText = this.translate.instant('Select');
    this.cancelText = this.translate.instant('Cancel');
    this.showLoading = false;
    this.minFiatAmount = 50;
    this.maxFiatAmount = 20000;

    if (_.isEmpty(this.wallets)) {
      this.showErrorAndBack(
        null,
        this.translate.instant('No wallets with funds')
      );
      return;
    }

    if (this.wallets.length == 1) this.onWalletSelect(this.wallets[0]);
    else this.showWallets();
  }

  private showErrorAndBack(title: string, msg): void {
    title = title ? title : this.translate.instant('Error');
    this.logger.error(msg);
    msg = msg && msg.errors ? msg.errors[0].message : msg;
    this.popupProvider.ionicAlert(title, msg).then(() => {
      this.navCtrl.pop();
    });
  }

  public showWallets(): void {
    this.isOpenSelector = true;
    const id = this.wallet ? this.wallet.credentials.walletId : null;
    const params = {
      wallets: this.wallets,
      selectedWalletId: id,
      title: this.translate.instant('Select wallet to deposit to')
    };
    const walletSelector = this.actionSheetProvider.createWalletSelector(
      params
    );
    walletSelector.present();
    walletSelector.onDidDismiss(wallet => {
      this.onSelectWalletEvent(wallet);
    });
  }

  private onSelectWalletEvent(wallet): void {
    if (!_.isEmpty(wallet)) this.onWalletSelect(wallet);
    this.isOpenSelector = false;
  }

  public currencyIsFiat(): boolean {
    return (
      this.supportedFiatAltCurrencies.indexOf(
        this.quoteForm.value.altCurrency
      ) > -1
    );
  }

  public onWalletSelect(wallet): void {
    this.setWallet(wallet);
    this.setDefaultValues();
    this.amountChange();
  }

  private setWallet(wallet): void {
    this.wallet = wallet;
  }

  private setDefaultValues() {
    this.quoteForm.controls['amount'].setValue(undefined);
    this.quoteForm.controls['altCurrency'].setValue('USD');
    this.quoteForm.controls['amount'].setValidators([
      Validators.required,
      Validators.min(50),
      Validators.max(20000)
    ]);
    this.minFiatAmount = 50;
    this.maxFiatAmount = 20000;
    this.quoteForm.controls['amount'].setValue(120);
  }

  public altCurrencyChange(): void {
    this.logger.debug(
      'altCurrency changed to: ' + this.quoteForm.value.altCurrency
    );

    if (this.currencyIsFiat()) {
      this.quoteForm.controls['amount'].setValue(undefined);
      this.quoteForm.controls['amount'].setValidators([
        Validators.required,
        Validators.min(50),
        Validators.max(20000)
      ]);
      this.minFiatAmount = 50;
      this.maxFiatAmount = 20000;
      this.quoteForm.controls['amount'].setValue(120);
    } else {
      this.quoteForm.controls['amount'].setValue(undefined);

      let coin = this.quoteForm.value.altCurrency.toLowerCase();
      let alternative = 'USD';
      let min = +(
        this.rateProvider.fromFiat(50, alternative, coin) /
        this.currencyProvider.getPrecision(coin).unitToSatoshi
      ).toFixed(8);
      let max = +(
        this.rateProvider.fromFiat(20000, alternative, coin) /
        this.currencyProvider.getPrecision(coin).unitToSatoshi
      ).toFixed(8);

      this.quoteForm.controls['amount'].setValidators([
        Validators.required,
        Validators.min(min),
        Validators.max(max)
      ]);
      this.minFiatAmount = min;
      this.maxFiatAmount = max;
      this.quoteForm.controls['amount'].setValue(1);
    }

    this.amountChange();
  }

  public amountChange(): void {
    if (this.quoteForm.valid && !_.isEmpty(this.wallet)) {
      this.debounceAmountInput();
    }
  }

  private debounceAmountInput = _.debounce(
    () => {
      this.getSimplexQuote();
    },
    1500,
    {
      leading: true
    }
  );

  public getEvents(): void {
    this.simplexProvider
      .getEvents(this.wallet)
      .then(_data => {})
      .catch(err => {
        this.showError(err);
      });
  }

  private getSimplexQuote(): void {
    this.showLoading = true;
    const data = {
      digital_currency: this.currencyProvider.getChain(this.wallet.coin),
      fiat_currency: this.currencyIsFiat()
        ? this.quoteForm.value.altCurrency
        : 'USD',
      requested_currency: this.quoteForm.value.altCurrency,
      requested_amount: +this.quoteForm.value.amount,
      end_user_id: this.wallet.id // TODO: BitPay id / wallet id??
    };

    this.simplexProvider
      .getQuote(this.wallet, data)
      .then(data => {
        if (data) {
          this.cryptoAmount = data.digital_money.amount;
          this.fiatBaseAmount = data.fiat_money.base_amount;
          this.fiatTotalAmount = data.fiat_money.total_amount;
          this.fiatCurrency = data.fiat_money.currency;
          this.quoteId = data.quote_id;
          this.validUntil = data.valid_until;
          this.showLoading = false;
        }
      })
      .catch(err => {
        this.showError(err);
      });
  }

  simplexPaymentRequest(address: string): Promise<any> {
    const userAgent = this.platformProvider.getUserAgent();
    const data = {
      account_details: {
        app_version_id: this.appProvider.info.version,
        app_install_date: this.createdOn,
        app_end_user_id: this.wallet.id, // TODO: BitPay id / wallet id??
        signup_login: {
          user_agent: userAgent, // Format: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0'
          timestamp: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ')
        }
      },
      transaction_details: {
        payment_details: {
          quote_id: this.quoteId,
          fiat_total_amount: {
            currency: this.currencyIsFiat()
              ? this.quoteForm.value.altCurrency
              : 'USD',
            amount: this.fiatTotalAmount
          },
          requested_digital_amount: {
            currency: this.currencyProvider.getChain(this.wallet.coin),
            amount: this.cryptoAmount
          },
          destination_wallet: {
            currency: this.currencyProvider.getChain(this.wallet.coin),
            address,
            tag: ''
          },
          original_http_ref_url:
            'https://' + this.simplexProvider.passthrough_uri
        }
      }
    };

    return this.simplexProvider.paymentRequest(this.wallet, data);
  }

  public simplexPaymentFormSubmission(data) {
    const dataSrc = {
      version: '1',
      partner: data.app_provider_id,
      payment_flow_type: 'wallet',
      return_url_success:
        this.simplexProvider.passthrough_uri +
        'end.html?success=true&paymentId=' +
        data.payment_id +
        '&quoteId=' +
        this.quoteId +
        '&userId=' +
        this.wallet.id +
        '&returnApp=' +
        this.appProvider.info.name,
      return_url_fail:
        this.simplexProvider.passthrough_uri +
        'end.html?success=false&paymentId=' +
        data.payment_id +
        '&quoteId=' +
        this.quoteId +
        '&userId=' +
        this.wallet.id +
        '&returnApp=' +
        this.appProvider.info.name,
      quote_id: this.quoteId,
      payment_id: data.payment_id,
      user_id: this.wallet.id,
      'destination_wallet[address]': data.address,
      'destination_wallet[currency]': this.currencyProvider.getChain(
        this.wallet.coin
      ),
      'fiat_total_amount[amount]': this.fiatTotalAmount,
      'fiat_total_amount[currency]': this.currencyIsFiat()
        ? this.quoteForm.value.altCurrency
        : 'USD',
      'digital_total_amount[amount]': this.cryptoAmount,
      'digital_total_amount[currency]': this.currencyProvider.getChain(
        this.wallet.coin
      )
    };

    var str = '';
    for (var key in dataSrc) {
      if (str != '') {
        str += '&';
      }
      str += key + '=' + encodeURIComponent(dataSrc[key]);
    }

    const url =
      this.simplexProvider.passthrough_uri +
      '?api_host=' +
      data.api_host +
      '/payments/new/&' +
      str;
    this.openExternalLink(url);
  }

  public openPopUpConfirmation(): void {
    const title = this.translate.instant('Continue to Simplex');
    const message = this.translate.instant(
      'In order to finish the payment process you will be redirected to Simplex page'
    );
    const okText = this.translate.instant('Continue');
    const cancelText = this.translate.instant('Go back');
    this.popupProvider
      .ionicConfirm(title, message, okText, cancelText)
      .then((res: boolean) => {
        if (res) this.continueToSimplex();
      });
  }

  public continueToSimplex(): void {
    this.walletProvider
      .getAddress(this.wallet, false)
      .then(address => {
        this.simplexPaymentRequest(address)
          .then(req => {
            if (req && req.error && !_.isEmpty(req.error)) {
              this.showError(req.error);
              return;
            }

            const remoteData: any = {
              address,
              api_host: req.api_host,
              app_provider_id: req.app_provider_id,
              order_id: req.order_id,
              payment_id: req.payment_id
            };

            let newData = {
              address,
              created_on: Date.now(),
              crypto_amount: this.cryptoAmount,
              coin: this.currencyProvider.getChain(this.wallet.coin),
              fiat_total_amount: this.fiatTotalAmount,
              fiat_total_amount_currency: this.currencyIsFiat()
                ? this.quoteForm.value.altCurrency
                : 'USD',
              order_id: req.order_id,
              payment_id: req.payment_id,
              status: 'paymentRequestSent',
              user_id: this.wallet.id
            };
            this.simplexProvider
              .saveSimplex(newData, null)
              .then(() => {
                this.logger.debug(
                  'Saved Simplex with status: ' + newData.status
                );
                this.simplexPaymentFormSubmission(remoteData);
                this.navCtrl.pop();
              })
              .catch(err => {
                this.showError(err);
              });
          })
          .catch(err => {
            this.showError(err);
          });
      })
      .catch(err => {
        return this.showError(err);
      });
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }

  private showError(err?) {
    this.showLoading = false;
    let msg = this.translate.instant(
      'Could not create payment request. Please, try again later.'
    );
    if (err) {
      if (_.isString(err)) {
        msg = err;
      } else {
        if (err.error && err.error.error) msg = err.error.error;
        else if (err.message) msg = err.message;
      }
    }

    this.logger.error('Simplex error: ' + msg);

    const title = this.translate.instant('Error');
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'default-error',
      { msg, title }
    );
    infoSheet.present();
    infoSheet.onDidDismiss(() => {
      this.navCtrl.pop();
    });
  }
}
