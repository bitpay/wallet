import { Component, HostListener } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';

//providers
import { ProfileProvider } from '../../../providers/profile/profile';
import { PlatformProvider } from '../../../providers/platform/platform';
import { NodeWebkitProvider } from '../../../providers/node-webkit/node-webkit';

//pages
import { ConfirmPage } from '../confirm/confirm';
import { CustomAmountPage } from '../../receive/custom-amount/custom-amount';

@Component({
  selector: 'page-amount',
  templateUrl: 'amount.html',
})
export class AmountPage {
  private LENGTH_EXPRESSION_LIMIT = 19;
  private SMALL_FONT_SIZE_LIMIT = 10;

  public expression: any;
  public amount: any;
  public showExpressionResult: boolean;

  public smallFont: boolean;
  public allowSend: boolean;
  public fromSend: boolean;
  public recipientType: string;
  public toAddress: string;
  public name: string;
  public email: string;
  public color: string;
  public showSendMax: boolean;
  public useSendMax: boolean;

  private availableUnits: Array<any> = [];
  private unitIndex: number = 0;
  private altUnitIndex: number = 0;
  private reNr: RegExp;
  private reOp: RegExp;
  private _id: number;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private platformProvider: PlatformProvider,
    private nodeWebkitProvider: NodeWebkitProvider,
  ) {
    this.expression = '';
    this.amount = 0;
    this.showExpressionResult = false;
    this.allowSend = false;
    this.reNr = /^[1234567890\.]$/;
    this.reOp = /^[\*\+\-\/]$/;
  }
  
  ionViewDidLoad() {
    this.toAddress = this.navParams.data.toAddress;
    this.fromSend = this.navParams.data.fromSend;
    this._id = this.navParams.data.id;
    this.recipientType = this.navParams.data.recipientType || null;
    this.name = this.navParams.data.name;
    this.email = this.navParams.data.email;
    this.color = this.navParams.data.color;
    // this.expression = this.navParams.data.amount;
    // this.setAvailableUnits();
    // this.updateUnitUI();
    this.processAmount();
  }

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
      if (event.ctrlKey || event.metaKey) this.processClipboard();
    } else if (event.keyCode === 13) this.finish();
  }

  private paste(value: string): void {
    this.expression = value;
    this.processAmount();
  };

  public processClipboard(): void {
    if (!this.platformProvider.isNW) return;

    let value = this.nodeWebkitProvider.readFromClipboard();
    
    if (value && this.evaluate(value) > 0) 
      this.paste(this.evaluate(value));
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
    if (this.expression && this.isExpression(this.expression)) {
      let amount = this.evaluate(this.format(this.expression));
      // this.globalResult = '= ' + this.processResult(amount);
    }
  };

  public changeUnit(): void {
    this.unitIndex++;
    if (this.unitIndex >= this.availableUnits.length) this.unitIndex = 0;

    if (this.availableUnits[this.unitIndex].isFiat) {
      // Always return to BTC... TODO?
      this.altUnitIndex = 0;
    } else {
      this.altUnitIndex = _.findIndex(this.availableUnits, function(o) {
        return o.isFiat == true;
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

  public pushDigit(digit: string): void {
    if (this.expression && this.expression.length >= this.LENGTH_EXPRESSION_LIMIT) return;
    this.expression = (this.expression + digit).replace('..', '.');
    this.processAmount();
  };

  public removeDigit(): void {
    this.expression = this.expression.slice(0, -1);
    this.processAmount();
  };

  public pushOperator(operator: string): void {
    if (!this.expression || this.expression.length == 0) return;
    this.expression = this._pushOperator(this.expression, operator);
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

  private processAmount(): void {
    var formatedValue = this.format(this.expression);
    var result = this.evaluate(formatedValue);
    this.allowSend = _.isNumber(result) && +result > 0;

    if (_.isNumber(result)) {
      this.amount = result;
      this.showExpressionResult = this.isExpression(this.expression);
    }
  };

  format(val: string) {
    if (!val) return;

    var result = val.toString();

    if (this.isOperator(_.last(val))) 
      result = result.slice(0, -1);

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

  public finish(): void {
  //   let unit = this.availableUnits[this.unitIndex];
  //   let _amount = this.evaluate(this.format(this.amountStr));
  //   var coin = unit.id;
  //   if (unit.isFiat) {
  //     coin = this.availableUnits[this.altUnitIndex].id;
  //   }

  //   if (this.nextStep) {

  //     this.navCtrl.push(this.nextStep, {
  //       id: this._id,
  //       amount: this.useSendMax ? null : _amount,
  //       currency: unit.id.toUpperCase(),
  //       coin: coin,
  //       useSendMax: this.useSendMax
  //     });
  //   } else {
  //     let amount = _amount;

  //     if (unit.isFiat) {
  //       amount = (this.fromFiat(amount) * this.unitToSatoshi).toFixed(0);
  //     } else {
  //       amount = (amount * this.unitToSatoshi).toFixed(0);
  //     }

  //     let data: any = {
  //       recipientType: this.recipientType,
  //       amount: this.globalResult,
  //       toAddress: this.toAddress,
  //       name: this.name,
  //       email: this.email,
  //       color: this.color,
  //       coin: coin,
  //       useSendMax: this.useSendMax
  //     }
  //     if (this.navParams.data.fromSend) {
  //       this.navCtrl.push(ConfirmPage, data);
  //     } else {
  //       this.navCtrl.push(CustomAmountPage, data);
  //     }
  //   }
  }

  private setAvailableUnits(): void {
    let hasBTCWallets = this.profileProvider.getWallets({ coin: 'btc' }).length;

    if (hasBTCWallets) {
      this.availableUnits.push({
        name: 'Bitcoin',
        id: 'btc',
        shortName: 'BTC',
      });
    }

    let hasBCHWallets = this.profileProvider.getWallets({ coin: 'bch' }).length;

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
    // if (this.navParams.data.currency) {
    //   this.fiatCode = this.navParams.data.currency;
    //   this.altUnitIndex = unitIndex
    //   unitIndex = this.availableUnits.length;
    // } else {
    //   this.fiatCode = this.config.alternativeIsoCode || 'USD';
    //   fiatName = this.config.alternanativeName || this.fiatCode;
    //   this.altUnitIndex = this.availableUnits.length;
    // }

    // this.availableUnits.push({
    //   name: fiatName || this.fiatCode,
    //   // TODO
    //   id: this.fiatCode,
    //   shortName: this.fiatCode,
    //   isFiat: true,
    // });

    // if (this.navParams.data.fixedUnit) {
    //   this.fixedUnit = true;
    // }
  }
}
