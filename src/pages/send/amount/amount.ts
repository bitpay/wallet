import { Component, HostListener } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';

//providers
import { ProfileProvider } from '../../../providers/profile/profile';
import { ConfigProvider } from '../../../providers/config/config';
import { PlatformProvider } from '../../../providers/platform/platform';
import { NodeWebkitProvider } from '../../../providers/node-webkit/node-webkit';
import { RateProvider } from '../../../providers/rate/rate';
import { Filter } from '../../../providers/filter/filter';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';

//pages
import { ConfirmPage } from '../confirm/confirm';
import { CustomAmountPage } from '../../receive/custom-amount/custom-amount';

@Component({
  selector: 'page-amount',
  templateUrl: 'amount.html',
})
export class AmountPage {

  public amountStr: string = '';
  public smallFont: boolean;
  public allowSend: boolean;
  public globalResult: string;
  public fromSend: boolean;
  public unit: string;
  public alternativeUnit: string;
  public recipientType: string;
  public toAddress: string;
  public name: string;
  public email: string;
  public color: string;
  public amount: number;
  public showSendMax: boolean = false;
  public useSendMax: boolean;
  public alternativeAmount: number;

  private LENGTH_EXPRESSION_LIMIT = 19;
  private SMALL_FONT_SIZE_LIMIT = 10;
  private availableUnits: Array<any> = [];
  private unitIndex: number = 0;
  private reNr: RegExp = /^[1234567890\.]$/;
  private reOp: RegExp = /^[\*\+\-\/]$/;
  private fiatCode: string;
  private altUnitIndex: number = 0;
  private fixedUnit: boolean;
  private _id: number;
  private nextStep: string;

  // Config Related values
  public config: any;
  public walletConfig: any;
  public unitToSatoshi: number;
  public unitDecimals: number;
  public satToUnit: number;
  public configFeeLevel: string;
  public satToBtc: number;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public profileProvider: ProfileProvider,
    private configProvider: ConfigProvider,
    private logger: Logger,
    private platformProvider: PlatformProvider,
    private nodeWebkitProvider: NodeWebkitProvider,
    private rateProvider: RateProvider,
    private filter: Filter,
    private txFormatProvider: TxFormatProvider
  ) {
    this.allowSend = false;
    this.config = this.configProvider.get();
    this.walletConfig = this.config.wallet;
    this.unitToSatoshi = this.walletConfig.settings.unitToSatoshi;
    this.unitDecimals = this.walletConfig.settings.unitDecimals;
    this.satToUnit = 1 / this.unitToSatoshi;
    this.satToBtc = 1 / 100000000;
    this.configFeeLevel = this.walletConfig.settings.feeLevel ? this.walletConfig.settings.feeLevel : 'normal';
  }

  ionViewDidLoad() {
    console.log('Params', this.navParams.data);
    this.toAddress = this.navParams.data.toAddress;
    this.fromSend = this.navParams.data.fromSend;
    this._id = this.navParams.data.id;
    this.nextStep = this.navParams.data.nextStep;
    this.recipientType = this.navParams.data.recipientType || null;
    this.name = this.navParams.data.name;
    this.email = this.navParams.data.email;
    this.color = this.navParams.data.color;
    this.amount = this.navParams.data.amount;
    this.setAvailableUnits();
    this.updateUnitUI();
    //this.showMenu = $ionicHistory.backView() && ($ionicHistory.backView().stateName == 'tabs.send' || $ionicHistory.backView().stateName == 'tabs.bitpayCard'); TODO
    if (!this.nextStep && !this.toAddress) {
      this.logger.error('Bad params at amount')
      throw ('bad params');
    }
    // in SAT ALWAYS
    if (this.amount) {
      this.amountStr = ((this.amount) * this.satToUnit).toFixed(this.unitDecimals);
    }
    this.processAmount();
  }

  private paste(value: string): void {
    this.amountStr = value;
    this.processAmount();
  };

  public processClipboard(): void {
    if (!this.platformProvider.isNW) return;
    var value = this.nodeWebkitProvider.readFromClipboard();
    if (value && this.evaluate(value) > 0) this.paste(this.evaluate(value));
  };

  public showSendMaxMenu(): void {
    this.showSendMax = true;
  }

  public sendMax(): void {
    this.showSendMax = false;
    this.useSendMax = true;
    this.finish();
  };

  public toggleAlternative(): void {
    if (this.amountStr && this.isExpression(this.amountStr)) {
      let amount = this.evaluate(this.format(this.amountStr));
      this.globalResult = '= ' + this.processResult(amount);
    }
  };

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

    this.updateUnitUI();
  };

  public changeAlternativeUnit(): void {

    // Do nothing is fiat is not main unit
    if (!this.availableUnits[this.unitIndex].isFiat) return;

    var nextCoin = _.findIndex(this.availableUnits, function (x) {
      if (x.isFiat) return false;
      if (x.id == this.availableUnits[this.altUnitIndex].id) return false;
      return true;
    });

    if (nextCoin >= 0) {
      this.altUnitIndex = nextCoin;
      this.updateUnitUI();
    }
  };

  @HostListener('document:keydown', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
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
      // if (event.ctrlKey || event.metaKey) processClipboard();
    } else if (event.keyCode === 13) this.finish();
  }

  public pushDigit(digit: string): void {
    if (this.amountStr && this.amountStr.length >= this.LENGTH_EXPRESSION_LIMIT) return;
    if (this.amountStr.indexOf('.') > -1 && digit == '.') return;
    // TODO: next line - Need: isFiat
    //if (this.availableUnits[this.unitIndex].isFiat && this.amountStr.indexOf('.') > -1 && this.amountStr[this.amountStr.indexOf('.') + 2]) return;

    this.amountStr = (this.amountStr + digit).replace('..', '.');
    this.checkFontSize();
    this.processAmount();
  };

  public removeDigit(): void {
    this.amountStr = (this.amountStr).toString().slice(0, -1);
    this.processAmount();
    this.checkFontSize();
  };

  public pushOperator(operator: string): void {
    if (!this.amountStr || this.amountStr.length == 0) return;
    this.amountStr = this._pushOperator(this.amountStr, operator);
  };

  private _pushOperator(val: string, operator: string) {
    if (!this.isOperator(_.last(val))) {
      return val + operator;
    } else {
      return val.slice(0, -1) + operator;
    }
  };

  private isOperator(val: string): boolean {
    const regex = /[\/\-\+\x\*]/;
    return regex.test(val);
  };

  private isExpression(val: string): boolean {
    const regex = /^\.?\d+(\.?\d+)?([\/\-\+\*x]\d?\.?\d+)+$/;
    return regex.test(val);
  };

  private checkFontSize(): void {
    if (this.amountStr && this.amountStr.length >= this.SMALL_FONT_SIZE_LIMIT) this.smallFont = true;
    else this.smallFont = false;
  };

  private processAmount(): void {
    var formatedValue = this.format(this.amountStr);
    var result = this.evaluate(formatedValue);
    this.allowSend = _.isNumber(result) && +result > 0;
    if (_.isNumber(result)) {
      this.globalResult = this.isExpression(this.amountStr) ? '= ' + this.processResult(result) : '';

      if (this.availableUnits[this.unitIndex].isFiat) {

        var a = this.fromFiat(result);
        if (a) {
          this.alternativeAmount = this.txFormatProvider.formatAmount(a * this.unitToSatoshi, true);
        } else {
          this.alternativeAmount = null;
          this.allowSend = false;
        }
      } else {
        this.alternativeAmount = this.filter.formatFiatAmount((this.toFiat(result)));
      }
      this.globalResult = result.toString();
    }
  };

  format(val: string) {
    if (!val) return;

    var result = val.toString();

    if (this.isOperator(_.last(val))) result = result.slice(0, -1);

    return result.replace('x', '*');
  };

  evaluate(val: string) {
    var result;
    try {
      result = eval(val);
    } catch (e) {
      return 0;
    }
    if (!_.isFinite(result)) return 0;
    return result;
  };

  private processResult(val: number): number {
    if (this.availableUnits[this.unitIndex].isFiat) return this.filter.formatFiatAmount(val);
    else return this.txFormatProvider.formatAmount(parseInt(val.toFixed(this.unitDecimals)) * this.unitToSatoshi, true);
  };

  private fromFiat(val: number): number {
    return parseFloat((this.rateProvider.fromFiat(val, this.fiatCode, this.availableUnits[this.altUnitIndex].id) * this.satToUnit).toFixed(this.unitDecimals));
  };

  private toFiat(val): number {
    if (!this.rateProvider.getRate(this.fiatCode)) return;
    return parseFloat((this.rateProvider.toFiat(val * this.unitToSatoshi, this.fiatCode, this.availableUnits[this.unitIndex].id)).toFixed(2));
  };

  public finish(): void {

    let unit = this.availableUnits[this.unitIndex];
    let _amount = this.evaluate(this.format(this.amountStr));
    var coin = unit.id;
    if (unit.isFiat) {
      coin = this.availableUnits[this.altUnitIndex].id;
    }

    if (this.nextStep) {

      this.navCtrl.push(this.nextStep, {
        id: this._id,
        amount: this.useSendMax ? null : _amount,
        currency: unit.id.toUpperCase(),
        coin: coin,
        useSendMax: this.useSendMax
      });
    } else {
      let amount = _amount;

      if (unit.isFiat) {
        amount = (this.fromFiat(amount) * this.unitToSatoshi).toFixed(0);
      } else {
        amount = (amount * this.unitToSatoshi).toFixed(0);
      }

      let data: any = {
        recipientType: this.recipientType,
        amount: this.globalResult,
        toAddress: this.toAddress,
        name: this.name,
        email: this.email,
        color: this.color,
        coin: coin,
        useSendMax: this.useSendMax
      }
      if (this.navParams.data.fromSend) {
        this.navCtrl.push(ConfirmPage, data);
      } else {
        this.navCtrl.push(CustomAmountPage, data);
      }
    }
  }


  private setAvailableUnits(): void {

    let hasBTCWallets = this.profileProvider.getWallets({
      coin: 'btc'
    }).length;

    if (hasBTCWallets) {
      this.availableUnits.push({
        name: 'Bitcoin',
        id: 'btc',
        shortName: 'BTC',
      });
    }

    let hasBCHWallets = this.profileProvider.getWallets({
      coin: 'bch'
    }).length;

    if (hasBCHWallets) {
      this.availableUnits.push({
        name: 'Bitcoin Cash',
        id: 'bch',
        shortName: 'BCH',
      });
    };

    let unitIndex = 0;
    if (this.navParams.data.coin) {
      var coins = this.navParams.data.coin.split(',');
      var newAvailableUnits = [];

      _.each(coins, (c) => {
        var coin = _.find(this.availableUnits, {
          id: c
        });
        if (!coin) {
          this.logger.warn('Could not find desired coin:' + this.navParams.data.coin)
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
      this.altUnitIndex = unitIndex
      unitIndex = this.availableUnits.length;
    } else {
      this.fiatCode = this.config.alternativeIsoCode || 'USD';
      fiatName = this.config.alternanativeName || this.fiatCode;
      this.altUnitIndex = this.availableUnits.length;
    }

    this.availableUnits.push({
      name: fiatName || this.fiatCode,
      // TODO
      id: this.fiatCode,
      shortName: this.fiatCode,
      isFiat: true,
    });

    if (this.navParams.data.fixedUnit) {
      this.fixedUnit = true;
    }
  }

  private updateUnitUI(): void {
    this.unit = this.availableUnits[this.unitIndex].shortName;
    this.alternativeUnit = this.availableUnits[this.altUnitIndex].shortName;

    this.processAmount();
    this.logger.debug('Update unit coin @amount unit:' + this.unit + " alternativeUnit:" + this.alternativeUnit);
  };

}
