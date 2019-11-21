import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';
import * as _ from 'lodash';


// Proviers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { CurrencyProvider } from '../../../providers/currency/currency';
import { Logger } from '../../../providers/logger/logger';
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

  public isOpenSelector: boolean
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
  private payment_id: string;
  private order_id: string;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private currencyProvider: CurrencyProvider,
    private fb: FormBuilder,
    private logger: Logger,
    private navCtrl: NavController,
    private profileProvider: ProfileProvider,
    private simplexProvider: SimplexProvider,
    private translate: TranslateService,
    private walletProvider: WalletProvider,
  ) {
    this.okText = this.translate.instant('Ok');
    this.cancelText = this.translate.instant('Cancel');
    this.showLoading = false;

    this.fiatAmountValidatorRegex = /^0*([5-8][0-9]|9[0-9]|[1-8][0-9]{2}|9[0-8][0-9]|99[0-9]|[1-8][0-9]{3}|9[0-8][0-9]{2}|99[0-8][0-9]|999[0-9]|1[0-9]{4}|20000)(?:\.\d{0,2})?$/; // For fiat amount range between 50 and 20k

    this.quoteForm = this.fb.group({
      fiatAmount: [null, [Validators.required, Validators.pattern(this.fiatAmountValidatorRegex)]],
      fiatAltCurrency: ['USD']
    });

    this.formSubmission = this.fb.group({
      'version': [null],
      'partner': [null],
      'payment_flow_type': [null],
      'return_url_success': [null],
      'return_url_fail': [null],
      'quote_id': [null],
      'payment_id': [null],
      'user_id': [null],
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
      network: 'livenet' // TODO: change to: this.simplexProvider.getNetwork()
    });
  }

  private createGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  public fiatAltCurrencyChange() {
    this.logger.debug('fiatAltCurrency changed to: ' + this.quoteForm.value.fiatAltCurrency);
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

  private getSimplexQuote(): void {
    this.showLoading = true;
    const opts = {
      digital_currency: this.currencyProvider.getChain(this.wallet.coin),
      fiat_currency: this.quoteForm.value.fiatAltCurrency,
      requested_currency: this.quoteForm.value.fiatAltCurrency,
      requested_amount: +this.quoteForm.value.fiatAmount,
      end_user_id: '11b111d1-161e-32d9-6bda-8dd2b5c8af17', // TODO: BitPay id ??
      client_ip: '1.2.3.4', // TODO client ip ?
      wallet_id: this.simplexProvider.getPartnerName()
    }

    this.simplexProvider.testSimplex(opts).then((data) => {
      if (data) {
        this.cryptoAmount = data.digital_money.amount
        this.quoteId = data.quote_id;
        this.validUntil = data.valid_until;
        this.showLoading = false;
      }
    }).catch(err => {
      this.showError(err);
    })
  }

  testSimplexPaymentRequest(address: string): Promise<any> {
    this.payment_id = this.createGuid();
    this.order_id = this.createGuid();
    const opts = {
      account_details: {
        app_provider_id: this.simplexProvider.getPartnerName(),
        app_version_id: "1.3.1",
        app_end_user_id: "11b111d1-161e-32d9-6bda-8dd2b5c8af17", // TODO: BitPay id ??
        app_install_date: "2018-01-03T15:23:12Z",
        signup_login: {
          ip: "1.2.3.4",
          location: "36.848460,-174.763332",
          uaid: "IBAnKPg1bdxRiT6EDkIgo24Ri8akYQpsITRKIueg+3XjxWqZlmXin7YJtQzuY4K73PWTZOvmuhIHu + ee8m4Cs4WLEqd2SvQS9jW59pMDcYu + Tpl16U / Ss3SrcFKnriEn4VUVKG9QnpAJGYB3JUAPx1y7PbAugNoC8LX0Daqg66E = ",
          accept_language: "de,en-US;q=0.7,en;q=0.3",
          http_accept_language: "de,en-US;q=0.7,en;q=0.3",
          user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0",
          cookie_session_id: "7r7rz_VfGC_viXTp5XPh5Bm--rWM6RyU",
          timestamp: "2018-01-15T09:27:34.431Z"
        }
      },
      transaction_details: {
        payment_details: {
          quote_id: this.quoteId,
          payment_id: this.payment_id,
          order_id: this.order_id,
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
            tag: ""
          },
          original_http_ref_url: "https://partner.com/"
        }
      }
    }

    return this.simplexProvider.paymentRequest(opts);
  }

  public testSimplexPaymentFormSubmission(address: string) {

    this.formSubmission.controls['version'].setValue(1);
    this.formSubmission.controls['partner'].setValue(this.simplexProvider.getPartnerName());
    this.formSubmission.controls['payment_flow_type'].setValue('wallet');
    this.formSubmission.controls['return_url_success'].setValue('bitpay://simplex');
    this.formSubmission.controls['return_url_fail'].setValue('bitpay://simplex');
    this.formSubmission.controls['quote_id'].setValue(this.quoteId);
    this.formSubmission.controls['payment_id'].setValue(this.payment_id);
    this.formSubmission.controls['user_id'].setValue('11b111d1-161e-32d9-6bda-8dd2b5c8af17'); // TODO: BitPay id ??
    this.formSubmission.controls['destination_wallet[address]'].setValue(address);
    this.formSubmission.controls['destination_wallet[currency]'].setValue(this.currencyProvider.getChain(this.wallet.coin));

    this.formSubmission.controls['fiat_total_amount[amount]'].setValue(+this.quoteForm.value.fiatAmount);
    this.formSubmission.controls['fiat_total_amount[currency]'].setValue(this.quoteForm.value.fiatAltCurrency);

    this.formSubmission.controls['digital_total_amount[amount]'].setValue(this.cryptoAmount);
    this.formSubmission.controls['digital_total_amount[currency]'].setValue(this.currencyProvider.getChain(this.wallet.coin));


    document.forms["formSubmission"].submit();
  }

  public continueToSimplex() {
    this.walletProvider
      .getAddress(this.wallet, false)
      .then(address => {
        this.testSimplexPaymentRequest(address).then(_data => {
          try {
            this.testSimplexPaymentFormSubmission(address);
          } catch (err) {
            this.showError(err);
          }
        }).catch(err => {
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
    console.log(err);
    this.showLoading = false;
    let msg = this.translate.instant('Could not create payment request. Please, try again later.');
    if (err) {
      if (_.isString(err)) {
        msg = err
      } else {
        if (err.error && err.error.error) msg = err.error.error;
        else if (err.message) msg = err.message;
      }
    }

    this.logger.error('Simplex error: ' + msg);

    const title = this.translate.instant('Simplex error');
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
