import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';
import * as _ from 'lodash';

// Proviers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../../providers/app/app';
import { CurrencyProvider } from '../../../providers/currency/currency';
import { Logger } from '../../../providers/logger/logger';
import { PlatformProvider } from '../../../providers/platform/platform';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { SimplexProvider } from '../../../providers/simplex/simplex';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-simplex',
  templateUrl: 'simplex.html'
})
export class SimplexPage {
  public shifts;
  public network: string;
  public showOauthForm: boolean;
  public accessToken: string;
  public code: string;
  public loading: boolean;
  public error: string;
  public headerColor: string;

  public isOpenSelector: boolean;
  public wallet;
  public wallets: any[];
  public quoteForm: FormGroup;
  public formSubmission: FormGroup;
  public cryptoAmount: number;
  public okText: string;
  public cancelText: string;
  public validUntil: string;
  public showLoading: boolean;

  private fiatAmountValidatorRegex: RegExp;
  private quoteId: string;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private appProvider: AppProvider,
    private currencyProvider: CurrencyProvider,
    private fb: FormBuilder,
    private logger: Logger,
    private navCtrl: NavController,
    private platformProvider: PlatformProvider,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider,
    private simplexProvider: SimplexProvider,
    private translate: TranslateService,
    private walletProvider: WalletProvider
  ) {
    this.okText = this.translate.instant('Ok');
    this.cancelText = this.translate.instant('Cancel');
    this.showLoading = false;

    this.fiatAmountValidatorRegex = /^0*([5-8][0-9]|9[0-9]|[1-8][0-9]{2}|9[0-8][0-9]|99[0-9]|[1-8][0-9]{3}|9[0-8][0-9]{2}|99[0-8][0-9]|999[0-9]|1[0-9]{4}|20000)(?:\.\d{0,2})?$/; // For fiat amount range between 50 and 20k

    this.quoteForm = this.fb.group({
      fiatAmount: [
        null,
        [Validators.required, Validators.pattern(this.fiatAmountValidatorRegex)]
      ],
      fiatAltCurrency: ['USD']
    });

    this.formSubmission = this.fb.group({
      version: [null],
      partner: [null],
      payment_flow_type: [null],
      return_url_success: [null],
      return_url_fail: [null],
      quote_id: [null],
      payment_id: [null],
      user_id: [null],
      'destination_wallet[address]': [null],
      'destination_wallet[currency]': [null],
      'fiat_total_amount[amount]': [null],
      'fiat_total_amount[currency]': [null],
      'digital_total_amount[amount]': [null],
      'digital_total_amount[currency]': [null]
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SimplexPage');

    this.wallets = this.profileProvider.getWallets({
      network: 'livenet',
      onlyComplete: true,
      coin: ['btc', 'bch', 'eth'],
      backedUp: true
    });
  }

  public fiatAltCurrencyChange() {
    this.logger.debug(
      'fiatAltCurrency changed to: ' + this.quoteForm.value.fiatAltCurrency
    );
    this.fiatAmountChange();
  }

  public fiatAmountChange() {
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
      fiat_currency: this.quoteForm.value.fiatAltCurrency,
      requested_currency: this.quoteForm.value.fiatAltCurrency,
      requested_amount: +this.quoteForm.value.fiatAmount,
      end_user_id: this.wallet.id // TODO: BitPay id / wallet id??
    };

    this.simplexProvider
      .getQuote(this.wallet, data)
      .then(data => {
        if (data) {
          this.cryptoAmount = data.digital_money.amount;
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
    return new Promise((resolve, reject) => {
      const userAgent = this.platformProvider.getUserAgent();
      const data = {
        account_details: {
          app_version_id: this.appProvider.info.version,
          app_end_user_id: this.wallet.id, // TODO: BitPay id / wallet id??
          signup_login: {
            user_agent: userAgent // Format: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0'
          }
        },
        transaction_details: {
          payment_details: {
            quote_id: this.quoteId,
            fiat_total_amount: {
              currency: this.quoteForm.value.fiatAltCurrency,
              amount: +this.quoteForm.value.fiatAmount
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
            original_http_ref_url: 'https://bitpay.com/'
          }
        }
      };

      this.simplexProvider
        .paymentRequest(this.wallet, data)
        .then(data => {
          return resolve(data);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public simplexPaymentFormSubmission(data) {
    document.forms['formSubmission'].setAttribute(
      'action',
      data.api_host + '/payments/new'
    );

    this.formSubmission.controls['version'].setValue('1'); // Version of Simplex’s form to work with. Currently is “1”.
    this.formSubmission.controls['partner'].setValue(data.app_provider_id);
    this.formSubmission.controls['payment_flow_type'].setValue('wallet'); // Payment flow type: should be “wallet”
    this.formSubmission.controls['return_url_success'].setValue(
      'bitpay://simplex?success'
    );
    this.formSubmission.controls['return_url_fail'].setValue(
      'bitpay://simplex?error'
    );
    this.formSubmission.controls['quote_id'].setValue(this.quoteId);
    this.formSubmission.controls['payment_id'].setValue(data.payment_id);
    this.formSubmission.controls['user_id'].setValue(this.wallet.id); // TODO: BitPay id / wallet id??
    this.formSubmission.controls['destination_wallet[address]'].setValue(
      data.address
    );
    this.formSubmission.controls['destination_wallet[currency]'].setValue(
      this.currencyProvider.getChain(this.wallet.coin)
    );
    this.formSubmission.controls['fiat_total_amount[amount]'].setValue(
      +this.quoteForm.value.fiatAmount
    );
    this.formSubmission.controls['fiat_total_amount[currency]'].setValue(
      this.quoteForm.value.fiatAltCurrency
    );
    this.formSubmission.controls['digital_total_amount[amount]'].setValue(
      this.cryptoAmount
    );
    this.formSubmission.controls['digital_total_amount[currency]'].setValue(
      this.currencyProvider.getChain(this.wallet.coin)
    );

    document.forms['formSubmission'].submit();
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
            const data = {
              address,
              api_host: req.api_host,
              app_provider_id: req.app_provider_id,
              order_id: req.order_id,
              payment_id: req.payment_id
            };
            try {
              this.simplexPaymentFormSubmission(data);
            } catch (err) {
              this.showError(err);
            }
          })
          .catch(err => {
            this.showError(err);
          });
      })
      .catch(err => {
        return this.showError(err);
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

  public onWalletSelect(wallet): void {
    this.setWallet(wallet);
    this.fiatAmountChange(); // If amount was setted before wallet selection
  }

  private setWallet(wallet): void {
    this.wallet = wallet;
  }

  private showError(err?) {
    // console.log(err);
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
