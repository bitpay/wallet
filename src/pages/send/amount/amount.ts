import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { ConfirmPage } from '../confirm/confirm';
import { CustomAmountPage } from '../../receive/custom-amount/custom-amount';

@Component({
  selector: 'page-amount',
  templateUrl: 'amount.html',
})
export class AmountPage {

  public address: string;
  public amount: string;
  public smallFont: boolean;
  public allowSend: boolean;
  public globalResult: string;
  public sending: boolean;
  
  private LENGTH_EXPRESSION_LIMIT = 19;
  private SMALL_FONT_SIZE_LIMIT = 10;
  private availableUnits: Array<any> = [];
  private unitIndex: number = 0;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.amount = "";
    this.allowSend = false;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AmountPage');
    console.log("this.navParams.data", this.navParams.data);
    this.address = this.navParams.data.address;
    this.sending = this.navParams.data.sending;
  }

  pushDigit(digit: string) {
    if (this.amount && this.amount.length >= this.LENGTH_EXPRESSION_LIMIT) return;
    if (this.amount.indexOf('.') > -1 && digit == '.') return;
    // TODO: next line - Need: isFiat
    //if (this.availableUnits[this.unitIndex].isFiat && this.amount.indexOf('.') > -1 && this.amount[this.amount.indexOf('.') + 2]) return;

    this.amount = (this.amount + digit).replace('..', '.');
    console.log("this.amount", this.amount);
    this.checkFontSize();
    this.processAmount();
  };

  removeDigit() {
    this.amount = (this.amount).toString().slice(0, -1);
    this.processAmount();
    this.checkFontSize();
  };

  pushOperator(operator: string) {
    if (!this.amount || this.amount.length == 0) return;
    this.amount = this._pushOperator(this.amount, operator);
  };

  _pushOperator(val: string, operator: string) {
    if (!this.isOperator(_.last(val))) {
      return val + operator;
    } else {
      return val.slice(0, -1) + operator;
    }
  };

  isOperator(val: string) {
    var regex = /[\/\-\+\x\*]/;
    return regex.test(val);
  };

  isExpression(val: string) {
    var regex = /^\.?\d+(\.?\d+)?([\/\-\+\*x]\d?\.?\d+)+$/;
    return regex.test(val);
  };

  checkFontSize() {
    if (this.amount && this.amount.length >= this.SMALL_FONT_SIZE_LIMIT) this.smallFont = true;
    else this.smallFont = false;
  };

  processAmount() {
    var formatedValue = this.format(this.amount);
    var result = this.evaluate(formatedValue);
    this.allowSend = _.isNumber(result) && +result > 0;
    if (_.isNumber(result)) {
      this.globalResult = this.isExpression(this.amount) ? '= ' + this.processResult(result) : '';

      // TODO this.globalResult is always undefinded - Need: processResult()
      /* if (this.availableUnits[this.unitIndex].isFiat) {

        var a = this.fromFiat(result);
        if (a) {
          this.alternativeAmount = txFormatService.formatAmount(a * unitToSatoshi, true);
        } else {
          this.alternativeAmount = 'N/A'; //TODO
          this.allowSend = false;
        }
      } else {
        this.alternativeAmount = $filter('formatFiatAmount')(toFiat(result));
      } */
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
    console.log("evaluate result: ", result);
    return result;
  };

  processResult(val: number) {
    // TODO: implement this function correctly - Need: txFormatService, isFiat, $filter
    console.log("processResult TODO");
    /*if (this.availableUnits[this.unitIndex].isFiat) return $filter('formatFiatAmount')(val);
    else return txFormatService.formatAmount(val.toFixed(unitDecimals) * unitToSatoshi, true);*/
  };

  fromFiat(val: number) {
    // TODO: implement next line correctly - Need: rateService
    //return parseFloat((rateService.fromFiat(val, fiatCode, availableUnits[altUnitIndex].id) * satToUnit).toFixed(unitDecimals));
  };

  toFiat(val) {
    // TODO: implement next line correctly - Need: rateService
    /*if (!rateService.getRate(fiatCode)) return;
    return parseFloat((rateService.toFiat(val * unitToSatoshi, fiatCode, availableUnits[unitIndex].id)).toFixed(2));*/
  };

  finish() {
    if(this.sending) {
      this.navCtrl.push(ConfirmPage, {address: this.address, amount: this.globalResult});      
    } else {
      console.log("To do");
      this.navCtrl.push(CustomAmountPage, {address: this.address, amount: this.globalResult});            
    }
  }

}
