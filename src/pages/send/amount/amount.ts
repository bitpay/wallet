import {
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone
} from '@angular/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { Config, ConfigProvider } from '../../../providers/config/config';
import { FilterProvider } from '../../../providers/filter/filter';
import { Logger } from '../../../providers/logger/logger';
import { NodeWebkitProvider } from '../../../providers/node-webkit/node-webkit';
import { PlatformProvider } from '../../../providers/platform/platform';
import { RateProvider } from '../../../providers/rate/rate';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';

// Pages
import { ActionSheetProvider, GiftCardProvider } from '../../../providers';
import { CardConifg, CardName } from '../../../providers/gift-card/gift-card';
import { ProfileProvider } from '../../../providers/profile/profile';
import { Coin } from '../../../providers/wallet/wallet';
import { BitPayCardTopUpPage } from '../../integrations/bitpay-card/bitpay-card-topup/bitpay-card-topup';
import { BuyCoinbasePage } from '../../integrations/coinbase/buy-coinbase/buy-coinbase';
import { SellCoinbasePage } from '../../integrations/coinbase/sell-coinbase/sell-coinbase';
import { ConfirmCardPurchasePage } from '../../integrations/gift-cards/confirm-card-purchase/confirm-card-purchase';
import { BuyGlideraPage } from '../../integrations/glidera/buy-glidera/buy-glidera';
import { SellGlideraPage } from '../../integrations/glidera/sell-glidera/sell-glidera';
import { ShapeshiftConfirmPage } from '../../integrations/shapeshift/shapeshift-confirm/shapeshift-confirm';
import { CustomAmountPage } from '../../receive/custom-amount/custom-amount';
import { WalletTabsChild } from '../../wallet-tabs/wallet-tabs-child';
import { WalletTabsProvider } from '../../wallet-tabs/wallet-tabs.provider';
import { ConfirmPage } from '../confirm/confirm';

@Component({
  selector: 'page-amount',
  templateUrl: 'amount.html'
})
export class AmountPage extends WalletTabsChild {
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

  public shiftMax: number;
  public shiftMin: number;
  public showSendMax: boolean;
  public allowSend: boolean;
  public recipientType: string;
  public toAddress: string;
  public network: string;
  public name: string;
  public email: string;
  public color: string;
  public useSendMax: boolean;
  public config: Config;
  public toWalletId: string;
  private _id: string;
  public requestingAmount: boolean;

  public cardName: CardName;
  public cardConfig: CardConifg;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private configProvider: ConfigProvider,
    private filterProvider: FilterProvider,
    private giftCardProvider: GiftCardProvider,
    private logger: Logger,
    navCtrl: NavController,
    private navParams: NavParams,
    private nodeWebkitProvider: NodeWebkitProvider,
    private platformProvider: PlatformProvider,
    profileProvider: ProfileProvider,
    private rateProvider: RateProvider,
    private txFormatProvider: TxFormatProvider,
    private changeDetectorRef: ChangeDetectorRef,
    walletTabsProvider: WalletTabsProvider,
    private events: Events
  ) {
    super(navCtrl, profileProvider, walletTabsProvider);
    this.zone = new NgZone({ enableLongStackTrace: false });
    this.config = this.configProvider.get();
    this.recipientType = this.navParams.data.recipientType;
    this.toAddress = this.navParams.data.toAddress;
    this.network = this.navParams.data.network;
    this.name = this.navParams.data.name;
    this.email = this.navParams.data.email;
    this.color = this.navParams.data.color;
    this.fixedUnit = this.navParams.data.fixedUnit;
    this.description = this.navParams.data.description;
    this.onlyIntegers = this.navParams.data.onlyIntegers
      ? this.navParams.data.onlyIntegers
      : false;

    this.showSendMax = false;
    this.useSendMax = false;
    this.allowSend = false;

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

    this.unitToSatoshi = this.config.wallet.settings.unitToSatoshi;
    this.satToUnit = 1 / this.unitToSatoshi;
    this.unitDecimals = this.config.wallet.settings.unitDecimals;

    // BitPay Card ID or Wallet ID
    this._id = this.navParams.data.id;

    // Use only with ShapeShift
    this.toWalletId = this.navParams.data.toWalletId;
    this.shiftMax = this.navParams.data.shiftMax;
    this.shiftMin = this.navParams.data.shiftMin;

    this.cardName = this.navParams.get('cardName');
  }

  async ionViewDidLoad() {
    this.setAvailableUnits();
    this.updateUnitUI();
    this.cardConfig =
      this.cardName &&
      (await this.giftCardProvider.getCardConfig(this.cardName));
  }

  ionViewWillEnter() {
    this.disableHardwareKeyboard = false;
    this.expression = '';
    this.useSendMax = false;
    this.processAmount();
    this.events.subscribe('Wallet/disableHardwareKeyboard', () => {
      this._disableHardwareKeyboard();
    });
  }

  ionViewWillLeave() {
    this._disableHardwareKeyboard();
  }

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
      this.pushDigit(event.key, true);
    } else if (event.key.match(this.reOp)) {
      this.pushOperator(event.key);
    } else if (event.keyCode === 86) {
      if (event.ctrlKey || event.metaKey) this.processClipboard();
    } else if (event.keyCode === 13) this.finish();
  }

  private setAvailableUnits(): void {
    this.availableUnits = [];

    const parentWalletCoin = this.wallet && this.wallet.coin;

    if (parentWalletCoin === 'btc' || !parentWalletCoin) {
      this.availableUnits.push({
        name: 'Bitcoin',
        id: 'btc',
        shortName: 'BTC'
      });
    }

    if (parentWalletCoin === 'bch' || !parentWalletCoin) {
      this.availableUnits.push({
        name: 'Bitcoin Cash',
        id: 'bch',
        shortName: 'BCH'
      });
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
      this.fiatCode = this.config.wallet.settings.alternativeIsoCode || 'USD';
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
      case 'BuyGlideraPage':
        nextPage = BuyGlideraPage;
        break;
      case 'SellGlideraPage':
        nextPage = SellGlideraPage;
        break;
      case 'BuyCoinbasePage':
        nextPage = BuyCoinbasePage;
        break;
      case 'SellCoinbasePage':
        nextPage = SellCoinbasePage;
        break;
      case 'CustomAmountPage':
        nextPage = CustomAmountPage;
        break;
      case 'ShapeshiftConfirmPage':
        this.showSendMax = true;
        nextPage = ShapeshiftConfirmPage;
        break;
      default:
        this.showSendMax = true;
        nextPage = ConfirmPage;
    }
    return nextPage;
  }

  public processClipboard(): void {
    if (!this.platformProvider.isNW) return;

    let value = this.nodeWebkitProvider.readFromClipboard();

    if (value && this.evaluate(value) > 0) this.paste(this.evaluate(value));
  }

  public sendMax(): void {
    this.useSendMax = true;
    if (!this.wallet) {
      return this.finish();
    }
    const maxAmount = this.txFormatProvider.satToUnit(
      this.wallet.status.availableBalanceSat
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
    return !this.expression && !this.requestingAmount && this.showSendMax;
  }

  public pushDigit(digit: string, isHardwareKeyboard?: boolean): void {
    this.useSendMax = false;
    if (digit === 'delete') {
      return this.removeDigit();
    }
    if (this.isSendMaxButtonShown() && digit === '0' && !isHardwareKeyboard) {
      return this.sendMax();
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
    });
  }

  public removeDigit(): void {
    this.zone.run(() => {
      this.expression = this.expression.slice(0, -1);
      this.processAmount();
      this.changeDetectorRef.detectChanges();
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

      if (this.availableUnits[this.unitIndex].isFiat) {
        let a = this.fromFiat(result);
        if (a) {
          this.alternativeAmount = this.txFormatProvider.formatAmount(
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
        val.toFixed(this.unitDecimals) * this.unitToSatoshi,
        true
      );
  }

  private fromFiat(val, coin?: string): number {
    coin = coin || this.availableUnits[this.altUnitIndex].id;
    return parseFloat(
      (
        this.rateProvider.fromFiat(val, this.fiatCode, coin) * this.satToUnit
      ).toFixed(this.unitDecimals)
    );
  }

  private toFiat(val: number, coin?: Coin): number {
    if (!this.rateProvider.getRate(this.fiatCode)) return undefined;

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

  public finish(): void {
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
        currency: unit.id.toUpperCase(),
        coin,
        useSendMax: this.useSendMax,
        toWalletId: this.toWalletId,
        cardName: this.cardName
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
        description: this.description
      };

      if (unit.isFiat) {
        data.fiatAmount = _amount;
        data.fiatCode = this.fiatCode;
      }
    }
    this.useSendMax = null;
    this.navCtrl.push(this.nextView, data);
  }

  private updateUnitUI(): void {
    this.unit = this.availableUnits[this.unitIndex].shortName;
    this.alternativeUnit = this.availableUnits[this.altUnitIndex].shortName;
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
}
