import {
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  Events,
  Navbar,
  NavController,
  NavParams,
  ViewController
} from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { ActionSheetProvider, IABCardProvider } from '../../../providers';
import { Config, ConfigProvider } from '../../../providers/config/config';
import { Coin, CurrencyProvider } from '../../../providers/currency/currency';
import { ElectronProvider } from '../../../providers/electron/electron';
import { FilterProvider } from '../../../providers/filter/filter';
import { getActivationFee } from '../../../providers/gift-card/gift-card';
import { CardConfig } from '../../../providers/gift-card/gift-card.types';
import { Logger } from '../../../providers/logger/logger';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ProfileProvider } from '../../../providers/profile/profile';
import { RateProvider } from '../../../providers/rate/rate';
import { SimplexProvider } from '../../../providers/simplex/simplex';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';

// Pages
import { CryptoOrderSummaryPage } from '../../buy-crypto/crypto-order-summary/crypto-order-summary';
import { BitPayCardTopUpPage } from '../../integrations/bitpay-card/bitpay-card-topup/bitpay-card-topup';
import { ConfirmCardPurchasePage } from '../../integrations/gift-cards/confirm-card-purchase/confirm-card-purchase';
import { CustomAmountPage } from '../../receive/custom-amount/custom-amount';
import { ConfirmPage } from '../confirm/confirm';

import { TranslateService } from '@ngx-translate/core';
import { CoinbaseWithdrawPage } from '../../integrations/coinbase/coinbase-withdraw/coinbase-withdraw';

@Component({
  selector: 'page-amount',
  templateUrl: 'amount.html'
})
export class AmountPage {
  private LENGTH_EXPRESSION_LIMIT: number;
  private availableUnits;
  public unit: string;
  private reNr: RegExp;
  private reOp: RegExp;
  private nextView;
  private fixedUnit: boolean;
  public fiatCode: string;
  private altUnitIndex: number;
  private unitIndex: number;
  private unitToSatoshi: number;
  private satToUnit: number;
  private unitDecimals: number;
  private zone;
  private description: string;

  public disableHardwareKeyboard: boolean;
  public onlyIntegers: boolean;
  public alternativeUnit: string;
  public globalResult: string;
  public alternativeAmount;
  public expression;
  public amount;

  public showSendMax: boolean;
  public allowSend: boolean;
  public useSmallFontSize: boolean;
  public recipientType: string;
  public toAddress: string;
  public network: string;
  public name: string;
  public email: string;
  public destinationTag?: string;
  public color: string;
  public useSendMax: boolean;
  public useAsModal: boolean;
  public config: Config;
  public toWalletId: string;
  private _id: string;
  public requestingAmount: boolean;
  public wallet;
  any;

  public cardName: string;
  public cardConfig: CardConfig;

  private fromCoinbase;
  private alternativeCurrency;
  public fromBuyCrypto: boolean;
  public fromExchangeCrypto: boolean;
  public quoteForm: FormGroup;
  public supportedFiatAltCurrencies: string[];
  public altCurrenciesToShow: string[];
  public altCurrenciesToShow2: string[];
  showLoading: boolean;
  cancelText: any;
  okText: any;
  selectOptions: { title: any; cssClass: string };
  altCurrencyInitial: any;
  supportedFiatWarning: boolean;

  @ViewChild(Navbar) navBar: Navbar;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private configProvider: ConfigProvider,
    private filterProvider: FilterProvider,
    private currencyProvider: CurrencyProvider,
    private logger: Logger,
    private navParams: NavParams,
    private electronProvider: ElectronProvider,
    private platformProvider: PlatformProvider,
    private rateProvider: RateProvider,
    private txFormatProvider: TxFormatProvider,
    private changeDetectorRef: ChangeDetectorRef,
    private events: Events,
    private viewCtrl: ViewController,
    private profileProvider: ProfileProvider,
    private navCtrl: NavController,
    private iabCardProvider: IABCardProvider,
    private simplexProvider: SimplexProvider,
    private formBuilder: FormBuilder,
    private translate: TranslateService
  ) {
    this.zone = new NgZone({ enableLongStackTrace: false });
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.config = this.configProvider.get();
    this.useAsModal = this.navParams.data.useAsModal;
    this.recipientType = this.navParams.data.recipientType;
    this.toAddress = this.navParams.data.toAddress;
    this.network = this.navParams.data.network;
    this.name = this.navParams.data.name;
    this.email = this.navParams.data.email;
    this.destinationTag = this.navParams.data.destinationTag;
    this.color = this.navParams.data.color;
    this.fixedUnit = this.navParams.data.fixedUnit;
    this.description = this.navParams.data.description;
    this.onlyIntegers = this.navParams.data.onlyIntegers
      ? this.navParams.data.onlyIntegers
      : false;
    this.fromCoinbase = this.navParams.data.fromCoinbase;
    this.alternativeCurrency = this.navParams.data.alternativeCurrency;
    this.fromBuyCrypto = this.navParams.data.fromBuyCrypto;
    this.fromExchangeCrypto = this.navParams.data.fromExchangeCrypto;

    this.showSendMax = false;
    this.useSendMax = false;
    this.allowSend = false;
    this.useSmallFontSize = false;

    this.availableUnits = [];
    this.expression = '';

    this.LENGTH_EXPRESSION_LIMIT = 19;
    this.amount = 0;
    this.altUnitIndex = 0;
    this.unitIndex = 0;

    this.reNr = /^[1234567890\.]$/;
    this.reOp = /^[\*\+\-\/]$/;

    this.requestingAmount =
      this.navParams.get('nextPage') === 'CustomAmountPage';
    this.nextView = this.getNextView();

    // BitPay Card ID or Wallet ID or Coinbase Account ID
    this._id = this.navParams.data.id;

    // Use only with Coinbase Withdraw
    this.toWalletId = this.navParams.data.toWalletId;

    this.cardName = this.navParams.get('cardName');
    this.cardConfig = this.navParams.get('cardConfig');
  }

  async ionViewDidLoad() {
    this.navBar.backButtonClick = () => {
      if (this.navParams.get('card') === 'v2') {
        this.iabCardProvider.show(true);
      }
      this.navCtrl.pop();
    };
    this.setAvailableUnits();
    if (this.fromBuyCrypto) this.setBuyCryptoParams();
    this.updateUnitUI();
  }

  ionViewWillEnter() {
    this.disableHardwareKeyboard = false;
    this.expression = '';
    this.useSendMax = false;
    this.processAmount();
    this.events.subscribe(
      'Wallet/disableHardwareKeyboard',
      this.walletDisableHardwareKeyboardHandler
    );
  }

  ionViewWillLeave() {
    this._disableHardwareKeyboard();
  }

  private walletDisableHardwareKeyboardHandler: any = () => {
    this._disableHardwareKeyboard();
  };

  private _disableHardwareKeyboard() {
    this.disableHardwareKeyboard = true;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.disableHardwareKeyboard) return;
    if (!event.key) return;
    if (event.which === 8) {
      event.preventDefault();
      this.removeDigit();
    }

    if (event.key.match(this.reNr)) {
      this.pushDigit(event.key);
    } else if (event.key.match(this.reOp)) {
      this.pushOperator(event.key);
    } else if (event.keyCode === 86) {
      if (event.ctrlKey || event.metaKey) this.processClipboard();
    } else if (event.keyCode === 13) this.finish();
  }

  public isCoin(coin: string): boolean {
    return !!Coin[coin];
  }

  private setAvailableUnits(): void {
    this.availableUnits = [];

    const parentWalletCoin = this.navParams.data.wallet
      ? this.navParams.data.wallet.coin
      : this.wallet && this.wallet.coin;

    for (const coin of this.currencyProvider.getAvailableCoins()) {
      if (parentWalletCoin === coin || !parentWalletCoin) {
        const { unitName, unitCode } = this.currencyProvider.getPrecision(coin);
        this.availableUnits.push({
          name: this.currencyProvider.getCoinName(coin),
          id: unitCode,
          shortName: unitName
        });
      }
    }

    this.unitIndex = 0;

    if (this.navParams.data.coin) {
      let coins = this.navParams.data.coin.split(',');
      let newAvailableUnits = [];

      _.each(coins, (c: string) => {
        let coin = _.find(this.availableUnits, {
          id: c
        });
        if (!coin) {
          this.logger.warn(
            'Could not find desired coin:' + this.navParams.data.coin
          );
        } else {
          newAvailableUnits.push(coin);
        }
      });

      if (newAvailableUnits.length > 0) {
        this.availableUnits = newAvailableUnits;
      }
    }

    //  currency have preference
    let fiatName;
    if (this.navParams.data.currency) {
      this.fiatCode = this.navParams.data.currency;
      this.altUnitIndex = this.unitIndex;
      this.unitIndex = this.availableUnits.length;
    } else {
      this.fiatCode =
        this.alternativeCurrency ||
        this.config.wallet.settings.alternativeIsoCode ||
        'USD';
      fiatName = this.config.wallet.settings.alternativeName || this.fiatCode;
      this.altUnitIndex = this.availableUnits.length;
    }

    this.availableUnits.push({
      name: fiatName || this.fiatCode,
      // TODO
      id: this.fiatCode,
      shortName: this.fiatCode,
      isFiat: true
    });

    if (this.navParams.data.fixedUnit) {
      this.fixedUnit = true;
    }
  }

  private paste(value: string): void {
    this.zone.run(() => {
      this.expression = value;
      this.processAmount();
      this.changeDetectorRef.detectChanges();
    });
  }

  private getNextView() {
    let nextPage;
    switch (this.navParams.data.nextPage) {
      case 'BitPayCardTopUpPage':
        this.showSendMax = true;
        nextPage = BitPayCardTopUpPage;
        break;
      case 'ConfirmCardPurchasePage':
        nextPage = ConfirmCardPurchasePage;
        break;
      case 'CustomAmountPage':
        nextPage = CustomAmountPage;
        break;
      case 'CryptoOrderSummaryPage':
        nextPage = CryptoOrderSummaryPage;
        break;
      case 'CoinbaseWithdrawPage':
        this.showSendMax = false;
        nextPage = CoinbaseWithdrawPage;
        break;
      default:
        this.showSendMax = true;
        nextPage = ConfirmPage;
    }
    return nextPage;
  }

  public processClipboard(): void {
    if (!this.platformProvider.isElectron) return;

    let value = this.electronProvider.readFromClipboard();

    if (value && this.evaluate(value) > 0) this.paste(this.evaluate(value));
  }

  public sendMax(): void {
    this.useSendMax = true;
    this.allowSend = true;
    if (!this.wallet) {
      return this.finish();
    }
    const maxAmount = this.txFormatProvider.satToUnit(
      this.wallet.cachedStatus.availableBalanceSat,
      this.wallet.coin
    );
    this.zone.run(() => {
      this.expression = this.availableUnits[this.unitIndex].isFiat
        ? this.toFiat(maxAmount, this.wallet.coin).toFixed(2)
        : maxAmount;
      this.processAmount();
      this.changeDetectorRef.detectChanges();
      this.finish();
    });
  }

  public isSendMaxButtonShown() {
    return (
      this.showSendMax && !this.requestingAmount && !this.useAsModal
      // ||
      // this.fromExchangeCrypto // TODO: implement send max
    );
  }

  public resizeFont(): void {
    this.useSmallFontSize = this.expression && this.expression.length >= 10;
  }

  public pushDigit(digit: string): void {
    this.useSendMax = false;
    if (digit === 'delete') {
      return this.removeDigit();
    }
    if (
      this.expression &&
      this.expression.length >= this.LENGTH_EXPRESSION_LIMIT
    )
      return;
    this.zone.run(() => {
      this.expression = (this.expression + digit).replace('..', '.');
      this.processAmount();
      this.changeDetectorRef.detectChanges();
      this.resizeFont();
    });
  }

  public removeDigit(): void {
    this.zone.run(() => {
      this.expression = this.expression.slice(0, -1);
      this.processAmount();
      this.changeDetectorRef.detectChanges();
      this.resizeFont();
    });
  }

  public pushOperator(operator: string): void {
    if (!this.expression || this.expression.length == 0) return;
    this.zone.run(() => {
      this.expression = this._pushOperator(this.expression, operator);
      this.changeDetectorRef.detectChanges();
    });
  }

  private _pushOperator(val: string, operator: string) {
    if (!this.isOperator(_.last(val))) {
      return val + operator;
    } else {
      return val.slice(0, -1) + operator;
    }
  }

  private isOperator(val: string): boolean {
    const regex = /[\/\-\+\x\*]/;
    return regex.test(val);
  }

  private isExpression(val: string): boolean {
    const regex = /^\.?\d+(\.?\d+)?([\/\-\+\*x]\d?\.?\d+)+$/;
    return regex.test(val);
  }

  public isNumber(expression): boolean {
    return _.isNumber(expression) ? true : false;
  }

  private processAmount(): void {
    let formatedValue = this.format(this.expression);
    let result = this.evaluate(formatedValue);
    this.allowSend = this.onlyIntegers
      ? _.isNumber(result) && +result > 0 && Number.isInteger(+result)
      : _.isNumber(result) && +result > 0;

    if (_.isNumber(result)) {
      this.globalResult = this.isExpression(this.expression)
        ? '= ' + this.processResult(result)
        : '';

      if (this.fromBuyCrypto) return;

      if (this.availableUnits[this.unitIndex].isFiat) {
        let a = this.fromFiat(result);
        if (a) {
          this.alternativeAmount = this.txFormatProvider.formatAmount(
            this.availableUnits[this.altUnitIndex].id,
            a * this.unitToSatoshi,
            true
          );
          this.checkAmountForBitpaycard(result);
        } else {
          this.alternativeAmount = result ? 'N/A' : null;
          this.allowSend = false;
        }
      } else {
        this.alternativeAmount = this.filterProvider.formatFiatAmount(
          this.toFiat(result)
        );
        this.checkAmountForBitpaycard(this.toFiat(result));
      }
    }
  }

  private checkAmountForBitpaycard(amount: number): void {
    // Check if the top up amount is at least 1 usd
    const isTopUp =
      this.navParams.data.nextPage === 'BitPayCardTopUpPage' ? true : false;
    if (isTopUp && amount < 1) {
      this.allowSend = false;
    }
  }

  private processResult(val): number {
    if (this.availableUnits[this.unitIndex].isFiat)
      return this.filterProvider.formatFiatAmount(val);
    else
      return this.txFormatProvider.formatAmount(
        this.unit.toLowerCase(),
        val.toFixed(this.unitDecimals) * this.unitToSatoshi,
        true
      );
  }

  private fromFiat(val, coin?: Coin): number {
    coin = coin || this.availableUnits[this.altUnitIndex].id;
    return parseFloat(
      (
        this.rateProvider.fromFiat(val, this.fiatCode, coin) * this.satToUnit
      ).toFixed(this.unitDecimals)
    );
  }

  private toFiat(val: number, coin?: Coin): number {
    if (
      !this.rateProvider.getRate(
        this.fiatCode,
        coin || this.availableUnits[this.unitIndex].id
      )
    )
      return undefined;

    return parseFloat(
      this.rateProvider
        .toFiat(
          val * this.unitToSatoshi,
          this.fiatCode,
          coin || this.availableUnits[this.unitIndex].id
        )
        .toFixed(2)
    );
  }

  private format(val: string): string {
    if (!val) return undefined;

    let result = val.toString();

    if (this.isOperator(_.last(val))) result = result.slice(0, -1);

    return result.replace('x', '*');
  }

  private evaluate(val: string) {
    let result;
    try {
      result = eval(val);
    } catch (e) {
      return 0;
    }
    if (!_.isFinite(result)) return 0;
    return result;
  }

  public validateGiftCardAmount(amount) {
    return (
      amount <= this.cardConfig.maxAmount && amount >= this.cardConfig.minAmount
    );
  }

  public showCardAmountInfoSheet(amount) {
    const sheetType =
      amount < this.cardConfig.minAmount
        ? 'below-minimum-gift-card-amount'
        : 'above-maximum-gift-card-amount';
    this.actionSheetProvider
      .createInfoSheet(sheetType, this.cardConfig)
      .present();
  }

  public finish(skipActivationFeeAlert: boolean = false): void {
    if (!this.allowSend) return;
    let unit = this.availableUnits[this.unitIndex];
    let _amount = this.evaluate(this.format(this.expression));
    let coin = unit.id;
    let data;

    if (unit.isFiat) {
      coin = this.availableUnits[this.altUnitIndex].id;
    }

    if (this.navParams.data.nextPage) {
      const amount = this.useSendMax ? null : _amount;
      if (this.cardConfig && !this.validateGiftCardAmount(amount)) {
        this.showCardAmountInfoSheet(amount);
        return;
      }

      data = {
        id: this._id,
        amount,
        currency: this.fromBuyCrypto ? this.unit : unit.id.toUpperCase(),
        coin,
        useSendMax: this.useSendMax,
        toWalletId: this.toWalletId,
        cardConfig: this.cardConfig,
        cardName: this.cardName,
        description: this.description
      };
    } else {
      let amount = _amount;
      amount = unit.isFiat
        ? (this.fromFiat(amount) * this.unitToSatoshi).toFixed(0)
        : (amount * this.unitToSatoshi).toFixed(0);
      data = {
        recipientType: this.recipientType,
        amount,
        toAddress: this.toAddress,
        name: this.name,
        email: this.email,
        color: this.color,
        coin,
        useSendMax: this.useSendMax,
        description: this.description,
        fromCoinbase: this.fromCoinbase,
        currency: this.unit
      };

      if (unit.isFiat) {
        data.fiatAmount = _amount;
        data.fiatCode = this.fiatCode;
      }
    }
    this.useSendMax = null;

    if (this.wallet) {
      data.walletId = this.wallet.credentials.walletId;
      data.network = this.wallet.network;
      if (this.wallet.credentials.token) {
        data.tokenAddress = this.wallet.credentials.token.address;
      }
      if (this.wallet.credentials.multisigEthInfo) {
        data.multisigContractAddress = this.wallet.credentials.multisigEthInfo.multisigContractAddress;
      }
    }

    if (this.destinationTag) {
      data.destinationTag = this.destinationTag;
    }

    if (this.navParams.data.fromWalletDetails) {
      data.fromWalletDetails = true;
    }

    if (this.cardName && !skipActivationFeeAlert) {
      const activationFee = getActivationFee(data.amount, this.cardConfig);
      if (activationFee) {
        return this.alertActivationFeeIncluded(activationFee);
      }
    }

    if (this.navParams.get('card') === 'v2') {
      data = {
        ...data,
        v2: true
      };
    }
    this.useAsModal
      ? this.closeModal(data)
      : this.navCtrl.push(this.nextView, data);
  }

  private alertActivationFeeIncluded(fee) {
    if (!fee) return;
    const sheet = this.actionSheetProvider.createInfoSheet(
      'activation-fee-included',
      {
        currency: this.cardConfig.currency,
        displayName: this.cardConfig.displayName,
        fee
      }
    );
    sheet.present();
    sheet.onDidDismiss(ok => ok && this.finish(true));
  }

  private updateUnitUI(): void {
    this.unit = this.fromBuyCrypto
      ? this.altCurrencyInitial
      : this.availableUnits[this.unitIndex].shortName;
    this.alternativeUnit = this.availableUnits[this.altUnitIndex].shortName;
    const { unitToSatoshi, unitDecimals } = this.availableUnits[this.unitIndex]
      .isFiat
      ? this.currencyProvider.getPrecision(
          this.availableUnits[this.altUnitIndex].id
        )
      : this.currencyProvider.getPrecision(this.unit.toLowerCase() as Coin);
    this.unitToSatoshi = unitToSatoshi;
    this.satToUnit = 1 / this.unitToSatoshi;
    this.unitDecimals = unitDecimals;
    this.processAmount();
    this.logger.debug(
      'Update unit coin @amount unit:' +
        this.unit +
        ' alternativeUnit:' +
        this.alternativeUnit
    );
  }

  private resetValues(): void {
    this.expression = '';
    this.globalResult = '';
    this.alternativeAmount = null;
  }

  public changeUnit(): void {
    if (this.fixedUnit) return;

    this.unitIndex++;
    if (this.unitIndex >= this.availableUnits.length) this.unitIndex = 0;

    if (this.availableUnits[this.unitIndex].isFiat) {
      // Always return to BTC... TODO?
      this.altUnitIndex = 0;
    } else {
      this.altUnitIndex = _.findIndex(this.availableUnits, {
        isFiat: true
      });
    }

    this.resetValues();

    this.zone.run(() => {
      this.updateUnitUI();
      this.changeDetectorRef.detectChanges();
    });
  }

  public closeModal(item): void {
    if (this.navParams.data.fromMultiSend) {
      if (item) this.events.publish('addRecipient', item);
      this.navCtrl.remove(this.viewCtrl.index - 1).then(() => {
        this.viewCtrl.dismiss();
      });
    } else {
      this.viewCtrl.dismiss(item);
    }
  }

  private setBuyCryptoParams() {
    const isoCode = this.config.wallet.settings.alternativeIsoCode;
    this.altCurrencyInitial =
      this.fiatCode && this.isSupportedFiat(this.fiatCode)
        ? this.fiatCode
        : this.isSupportedFiat(isoCode)
        ? isoCode
        : 'USD';

    this.quoteForm = this.formBuilder.group({
      amount: [
        200,
        [Validators.required, Validators.min(50), Validators.max(20000)]
      ],
      altCurrency: [this.altCurrencyInitial, [Validators.required]]
    });
    this.altCurrenciesToShow = ['USD', 'EUR'];
    this.altCurrenciesToShow2 = [];

    if (this.altCurrenciesToShow.indexOf(this.altCurrencyInitial) < 0)
      this.altCurrenciesToShow.push(this.altCurrencyInitial);

    this.selectOptions = {
      title: this.translate.instant('Select Currency'),
      cssClass: 'buy-crypto-currency-' + this.altCurrenciesToShow.length
    };

    this.supportedFiatAltCurrencies = this.simplexProvider.getSupportedFiatAltCurrencies();

    this.supportedFiatAltCurrencies.forEach((currency: string) => {
      if (this.altCurrenciesToShow.indexOf(currency) < 0)
        this.altCurrenciesToShow2.push(currency);
    });

    this.okText = this.translate.instant('Select');
    this.cancelText = this.translate.instant('Cancel');
    this.showLoading = false;
  }

  private isSupportedFiat(isoCode: string): boolean {
    return (
      this.simplexProvider.getSupportedFiatAltCurrencies().indexOf(isoCode) > -1
    );
  }

  public altCurrencyChange(): void {
    this.logger.debug(
      'altCurrency changed to: ' + this.quoteForm.value.altCurrency
    );
    this.unit = this.quoteForm.value.altCurrency;
  }
}
