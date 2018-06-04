import {
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController, NavController, NavParams } from 'ionic-angular';
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
import { BuyAmazonPage } from '../../integrations/amazon/buy-amazon/buy-amazon';
import { BitPayCardTopUpPage } from '../../integrations/bitpay-card/bitpay-card-topup/bitpay-card-topup';
import { BuyCoinbasePage } from '../../integrations/coinbase/buy-coinbase/buy-coinbase';
import { SellCoinbasePage } from '../../integrations/coinbase/sell-coinbase/sell-coinbase';
import { BuyGlideraPage } from '../../integrations/glidera/buy-glidera/buy-glidera';
import { SellGlideraPage } from '../../integrations/glidera/sell-glidera/sell-glidera';
import { BuyMercadoLibrePage } from '../../integrations/mercado-libre/buy-mercado-libre/buy-mercado-libre';
import { ShapeshiftConfirmPage } from '../../integrations/shapeshift/shapeshift-confirm/shapeshift-confirm';
import { CustomAmountPage } from '../../receive/custom-amount/custom-amount';
import { ConfirmPage } from '../confirm/confirm';

@Component({
  selector: 'page-amount',
  templateUrl: 'amount.html'
})
export class AmountPage {
  private LENGTH_EXPRESSION_LIMIT: number;
  private availableUnits: any[];
  private unit: string;
  private reNr: RegExp;
  private reOp: RegExp;
  private nextView: any;
  private fixedUnit: boolean;
  private itemSelectorLabel: string;
  private fiatCode: string;
  private altUnitIndex: number;
  private unitIndex: number;
  private unitToSatoshi: number;
  private satToUnit: number;
  private unitDecimals: number;
  private zone: any;

  public alternativeUnit: string;
  public globalResult: string;
  public alternativeAmount: any;
  public expression: any;
  public amount: any;

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
  public showRecipient: boolean;
  public toWalletId: string;
  private _id: string;

  constructor(
    private actionSheetCtrl: ActionSheetController,
    private configProvider: ConfigProvider,
    private filterProvider: FilterProvider,
    private logger: Logger,
    private navCtrl: NavController,
    private navParams: NavParams,
    private nodeWebkitProvider: NodeWebkitProvider,
    private platformProvider: PlatformProvider,
    private rateProvider: RateProvider,
    private txFormatProvider: TxFormatProvider,
    private translate: TranslateService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.zone = new NgZone({ enableLongStackTrace: false });
    this.config = this.configProvider.get();
    this.recipientType = this.navParams.data.recipientType;
    this.toAddress = this.navParams.data.toAddress;
    this.network = this.navParams.data.network;
    this.name = this.navParams.data.name;
    this.email = this.navParams.data.email;
    this.color = this.navParams.data.color;
    this.fixedUnit = this.navParams.data.fixedUnit;

    this.showRecipient = true;
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
    this.nextView = this.getNextView();
    this.itemSelectorLabel = this.translate.instant('Send Max amount');

    this.unitToSatoshi = this.config.wallet.settings.unitToSatoshi;
    this.satToUnit = 1 / this.unitToSatoshi;
    this.unitDecimals = this.config.wallet.settings.unitDecimals;

    // BitPay Card ID or Wallet ID
    this._id = this.navParams.data.id;

    // Use only with ShapeShift
    this.toWalletId = this.navParams.data.toWalletId;
    this.shiftMax = this.navParams.data.shiftMax;
    this.shiftMin = this.navParams.data.shiftMin;

    this.setAvailableUnits();
    this.updateUnitUI();
  }

  ionViewWillEnter() {
    this.expression = '';
    this.useSendMax = false;
    this.processAmount();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.navCtrl.getActive().name != 'AmountPage') return;
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

  private setAvailableUnits(): void {
    this.availableUnits = [];

    this.availableUnits.push({
      name: 'Bitcoin',
      id: 'btc',
      shortName: 'BTC'
    });

    this.availableUnits.push({
      name: 'Bitcoin Cash',
      id: 'bch',
      shortName: 'BCH'
    });

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

  private getNextView(): any {
    let nextPage;
    switch (this.navParams.data.nextPage) {
      case 'BitPayCardTopUpPage':
        this.showRecipient = false;
        this.showSendMax = true;
        nextPage = BitPayCardTopUpPage;
        break;
      case 'BuyAmazonPage':
        this.showRecipient = false;
        nextPage = BuyAmazonPage;
        break;
      case 'BuyGlideraPage':
        this.showRecipient = false;
        nextPage = BuyGlideraPage;
        break;
      case 'SellGlideraPage':
        this.showRecipient = false;
        nextPage = SellGlideraPage;
        break;
      case 'BuyCoinbasePage':
        this.showRecipient = false;
        nextPage = BuyCoinbasePage;
        break;
      case 'SellCoinbasePage':
        this.showRecipient = false;
        nextPage = SellCoinbasePage;
        break;
      case 'CustomAmountPage':
        nextPage = CustomAmountPage;
        break;
      case 'BuyMercadoLibrePage':
        this.showRecipient = false;
        nextPage = BuyMercadoLibrePage;
        break;
      case 'ShapeshiftConfirmPage':
        this.showSendMax = true;
        this.showRecipient = false;
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

  public showSendMaxMenu(): void {
    let buttons: any[] = [];

    let sendMaxButton = {
      text: this.itemSelectorLabel,
      icon: 'speedometer',
      handler: () => {
        this.sendMax();
      }
    };
    buttons.push(sendMaxButton);

    const actionSheet = this.actionSheetCtrl.create({
      buttons
    });

    actionSheet.present();
  }

  public sendMax(): void {
    this.useSendMax = true;
    this.finish();
  }

  public pushDigit(digit: string): void {
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
    this.allowSend = _.isNumber(result) && +result > 0;

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
        } else {
          this.alternativeAmount = result ? 'N/A' : null;
          this.allowSend = false;
        }
      } else {
        this.alternativeAmount = this.filterProvider.formatFiatAmount(
          this.toFiat(result)
        );
      }
    }
  }

  private processResult(val: any): number {
    if (this.availableUnits[this.unitIndex].isFiat)
      return this.filterProvider.formatFiatAmount(val);
    else
      return this.txFormatProvider.formatAmount(
        val.toFixed(this.unitDecimals) * this.unitToSatoshi,
        true
      );
  }

  private fromFiat(val: any, coin?: string): number {
    coin = coin || this.availableUnits[this.altUnitIndex].id;
    return parseFloat(
      (
        this.rateProvider.fromFiat(val, this.fiatCode, coin) * this.satToUnit
      ).toFixed(this.unitDecimals)
    );
  }

  private toFiat(val: number): number {
    if (!this.rateProvider.getRate(this.fiatCode)) return undefined;

    return parseFloat(
      this.rateProvider
        .toFiat(
          val * this.unitToSatoshi,
          this.fiatCode,
          this.availableUnits[this.unitIndex].id
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

  private evaluate(val: string): any {
    let result;
    try {
      result = eval(val);
    } catch (e) {
      return 0;
    }
    if (!_.isFinite(result)) return 0;
    return result;
  }

  public finish(): void {
    let unit = this.availableUnits[this.unitIndex];
    let _amount = this.evaluate(this.format(this.expression));
    let coin = unit.id;
    let data: any;

    if (unit.isFiat) {
      coin = this.availableUnits[this.altUnitIndex].id;
    }

    if (this.navParams.data.nextPage) {
      data = {
        id: this._id,
        amount: this.useSendMax ? null : _amount,
        currency: unit.id.toUpperCase(),
        coin,
        useSendMax: this.useSendMax,
        toWalletId: this.toWalletId
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
        useSendMax: this.useSendMax
      };
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

    this.zone.run(() => {
      this.updateUnitUI();
      this.changeDetectorRef.detectChanges();
    });
  }
}
