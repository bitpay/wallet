import { Component, HostListener } from '@angular/core';
import { NavController, NavParams, ActionSheetController } from 'ionic-angular';
import * as _ from 'lodash';

//providers
import { PlatformProvider } from '../../../providers/platform/platform';
import { ConfigProvider } from '../../../providers/config/config';
import { NodeWebkitProvider } from '../../../providers/node-webkit/node-webkit';
import { RateProvider } from '../../../providers/rate/rate';

//pages
import { BuyAmazonPage } from '../../integrations/amazon/buy-amazon/buy-amazon';
import { ConfirmPage } from '../confirm/confirm';
import { CustomAmountPage } from '../../receive/custom-amount/custom-amount';

@Component({
  selector: 'page-amount',
  templateUrl: 'amount.html',
})
export class AmountPage {
  private LENGTH_EXPRESSION_LIMIT: number;
  private availableUnits: Array<any>;
  private unit: string;
  private reNr: RegExp;
  private reOp: RegExp;
  private nextView: any;
  private fixedUnit: boolean;

  public isFiatAmount: boolean;
  public expression: any;
  public amount: any;
  public showExpressionResult: boolean;

  public allowSend: boolean;
  public recipientType: string;
  public addressInfo: any;
  public toAddress: string;
  public name: string;
  public email: string;
  public color: string;
  public coin: string;
  public network: string;
  public useSendMax: boolean;
  public config: any;

  private walletId: any;

  constructor(
    private actionSheetCtrl: ActionSheetController,
    private navCtrl: NavController,
    private navParams: NavParams,
    private platformProvider: PlatformProvider,
    private nodeWebkitProvider: NodeWebkitProvider,
    private configProvider: ConfigProvider,
    private rateProvider: RateProvider,
  ) {
    this.config = this.configProvider.get();
    this.recipientType = this.navParams.data.recipientType;
    this.toAddress = this.navParams.data.toAddress;
    this.walletId = this.navParams.data.walletId;
    this.network = this.navParams.data.network;
    this.name = this.navParams.data.name;
    this.email = this.navParams.data.email;
    this.color = this.navParams.data.color;
    this.coin = this.navParams.data.coin;
    this.fixedUnit = this.navParams.data.fixedUnit;
    this.LENGTH_EXPRESSION_LIMIT = 19;
    this.availableUnits = [];
    this.expression = '';
    this.amount = 0;
    this.useSendMax = false;
    this.showExpressionResult = false;
    this.allowSend = false;
    this.reNr = /^[1234567890\.]$/;
    this.reOp = /^[\*\+\-\/]$/;
    this.nextView = this.getNextView();

    if (this.navParams.data.currency) {
      this.availableUnits.push(this.coin.toUpperCase());
      this.availableUnits.push(this.navParams.data.currency);
      this.unit = this.navParams.data.currency;
    }
    else {
      let unit = this.config.wallet.settings.alternativeIsoCode;
      this.availableUnits.push(this.coin.toUpperCase());
      this.availableUnits.push(unit);
      this.unit = this.availableUnits[0];
    }
    this.isFiatAmount = this.unit != 'BCH' && this.unit != 'BTC' ? true : false;
  }

  @HostListener('document:keydown', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
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

  private paste(value: string): void {
    this.expression = value;
    this.processAmount();
  }

  private getNextView(): any {
    let nextPage;
    switch (this.navParams.data.nextPage) {
      case 'BuyAmazonPage':
        nextPage = BuyAmazonPage;
        break;
      case 'CustomAmountPage':
        nextPage = CustomAmountPage;
        break;
      default:
        nextPage = ConfirmPage;
    }
    return nextPage;
  }

  public processClipboard(): void {
    if (!this.platformProvider.isNW) return;

    let value = this.nodeWebkitProvider.readFromClipboard();

    if (value && this.evaluate(value) > 0)
      this.paste(this.evaluate(value));
  }

  public showSendMaxMenu(): void {
    let buttons: Array<any> = [];

    let sendMaxButton: Object = {
      text: 'Send Max amount',
      icon: 'speedometer',
      handler: () => {
        this.sendMax();
      }
    }
    buttons.push(sendMaxButton);

    const actionSheet = this.actionSheetCtrl.create({
      buttons: buttons
    });

    actionSheet.present();
  }

  public sendMax(): void {
    this.useSendMax = true;
    this.finish();
  }

  public pushDigit(digit: string): void {
    if (this.expression && this.expression.length >= this.LENGTH_EXPRESSION_LIMIT) return;
    this.expression = (this.expression + digit).replace('..', '.');
    this.processAmount();
  }

  public removeDigit(): void {
    this.expression = this.expression.slice(0, -1);
    this.processAmount();
  }

  public pushOperator(operator: string): void {
    if (!this.expression || this.expression.length == 0) return;
    this.expression = this._pushOperator(this.expression, operator);
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
      this.amount = result;
      this.showExpressionResult = this.isExpression(this.expression);
    }
  }

  private format(val: string) {
    if (!val) return;

    var result = val.toString();

    if (this.isOperator(_.last(val)))
      result = result.slice(0, -1);

    return result.replace('x', '*');
  }

  private evaluate(val: string) {
    var result;
    try {
      result = eval(val);
    } catch (e) {
      return 0;
    }
    if (!_.isFinite(result)) return 0;
    return result;
  }

  public finish(): void {
    let amount_: any;

    if (this.isFiatAmount) {
      let altIsoCode: string = this.config.wallet.settings.alternativeIsoCode;
      let unitCode: string = this.config.wallet.settings.unitCode;
      let value: any = this.rateProvider.fromFiat(this.amount, altIsoCode, unitCode) * 1e8;
      amount_ = parseInt(value);
    } else
      amount_ = this.amount * 1e8;

    let data: any = {
      recipientType: this.recipientType,
      toAddress: this.toAddress,
      amount: amount_,
      name: this.name,
      email: this.email,
      color: this.color,
      unit: this.unit.toLowerCase(),
      coin: this.coin,
      network: this.network,
      useSendMax: this.useSendMax,
      walletId: this.walletId
    }
    this.navCtrl.push(this.nextView, data);
  }

  public updateUnit(): void {
    if (this.fixedUnit) return;

    this.availableUnits.slice(0, this.availableUnits.length).join(',');
    this.availableUnits.push(this.availableUnits.shift());
    this.unit = this.availableUnits[0];
    this.isFiatAmount = this.unit != 'BCH' && this.unit != 'BTC' ? true : false;
  }
}
