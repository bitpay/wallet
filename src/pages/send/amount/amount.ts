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
import { BuyGlideraPage } from '../../integrations/glidera/buy-glidera/buy-glidera';
import { SellGlideraPage } from '../../integrations/glidera/sell-glidera/sell-glidera';
import { BuyCoinbasePage } from '../../integrations/coinbase/buy-coinbase/buy-coinbase';
import { SellCoinbasePage } from '../../integrations/coinbase/sell-coinbase/sell-coinbase';
import { ConfirmPage } from '../confirm/confirm';
import { CustomAmountPage } from '../../receive/custom-amount/custom-amount';
import { BuyMercadoLibrePage } from '../../integrations/mercado-libre/buy-mercado-libre/buy-mercado-libre';
import { ShapeshiftConfirmPage } from '../../integrations/shapeshift/shapeshift-confirm/shapeshift-confirm';
import { BitPayCardTopUpPage } from '../../integrations/bitpay-card/bitpay-card-topup/bitpay-card-topup';

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
  private itemSelectorLabel: string;

  public isFiatAmount: boolean;
  public expression: any;
  public amount: any;
  public showExpressionResult: boolean;
  public shiftMax: number;
  public shiftMin: number;
  public showSendMax: boolean;

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
  public showRecipient: boolean;
  public toWalletId: string;
  public cardId: string;

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
    this.showSendMax = false;
    this.config = this.configProvider.get();
    this.recipientType = this.navParams.data.recipientType;
    this.showRecipient = true;
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
    this.itemSelectorLabel = 'Send Max amount';

    // BitPay Card ID
    this.cardId = this.navParams.data.id;

    // Use only with ShapeShift
    this.toWalletId = this.navParams.data.toWalletId;
    this.shiftMax = this.navParams.data.shiftMax;
    this.shiftMin = this.navParams.data.shiftMin;

    if (this.shiftMax) {
      this.itemSelectorLabel = 'Send ShapeShift Maximum: ' + this.shiftMax;
    }

    let unit = this.navParams.data.currency ? this.navParams.data.currency : this.config.wallet.settings.alternativeIsoCode;
    this.availableUnits.push(this.coin.toUpperCase());
    this.availableUnits.push(unit);

    if (this.navParams.data.currency) {
      this.unit = this.navParams.data.currency;
    } else {
      this.unit = this.availableUnits[0];
    }
    this.isFiatAmount = this.unit != 'BCH' && this.unit != 'BTC' ? true : false;
  }

  ionViewWillEnter() {
    this.expression = '';
    this.processAmount();
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
      case 'BitPayCardTopUpPage':
        this.showRecipient = false;
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

    if (value && this.evaluate(value) > 0)
      this.paste(this.evaluate(value));
  }

  public showSendMaxMenu(): void {
    let buttons: Array<any> = [];

    let sendMaxButton: Object = {
      text: this.itemSelectorLabel,
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
    let amount_: number;
    let amountFiat: number;

    if (this.isFiatAmount) {
      let altIsoCode: string = this.config.wallet.settings.alternativeIsoCode;
      let unitCode: string = this.config.wallet.settings.unitCode;
      let value: any = this.rateProvider.fromFiat(this.amount, altIsoCode, unitCode);
      amount_ = parseInt(value);
      amountFiat = this.amount;
    } else
      amount_ = this.amount * 1e8;

    let data: any = {
      recipientType: this.recipientType,
      toAddress: this.toAddress,
      amount: this.useSendMax ? 0 : amount_,
      amountFiat: this.useSendMax ? 0 : amountFiat,
      name: this.name,
      email: this.email,
      color: this.color,
      currency: this.navParams.data.currency,
      coin: this.coin,
      network: this.network,
      useSendMax: this.useSendMax,
      walletId: this.walletId,
      toWalletId: this.toWalletId ? this.toWalletId : null,
      id: this.cardId
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
