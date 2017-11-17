import { Component, HostListener } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { AddressProvider } from '../../../providers/address/address';
import * as _ from 'lodash';

//providers
import { ProfileProvider } from '../../../providers/profile/profile';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ConfigProvider } from '../../../providers/config/config';
import { NodeWebkitProvider } from '../../../providers/node-webkit/node-webkit';

//pages
import { ConfirmPage } from '../confirm/confirm';
import { CustomAmountPage } from '../../receive/custom-amount/custom-amount';

@Component({
  selector: 'page-amount',
  templateUrl: 'amount.html',
})
export class AmountPage {
  private LENGTH_EXPRESSION_LIMIT: number;
  private SMALL_FONT_SIZE_LIMIT: number;
  private availableUnits: Array<any>;
  private unit: string;
  private reNr: RegExp;
  private reOp: RegExp;
  private nextView: any;

  public expression: any;
  public amount: any;
  public showExpressionResult: boolean;

  public allowSend: boolean;
  public fromSend: boolean;
  public recipientType: string;
  public addressInfo: any;
  public name: string;
  public email: string;
  public showSendMax: boolean;
  public useSendMax: boolean;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private platformProvider: PlatformProvider,
    private nodeWebkitProvider: NodeWebkitProvider,
    private configProvider: ConfigProvider,
    private bwcProvider: BwcProvider,
    private addressProvider: AddressProvider,
  ) {
    this.recipientType = this.navParams.data.recipientType || null;
    this.nextView = this.navParams.data.fromSend ? ConfirmPage : ConfirmPage;
    this.addressInfo = this.addressProvider.validateAddress(this.navParams.data.toAddress);
    this.name = this.navParams.data.name;
    this.email = this.navParams.data.email;
    this.LENGTH_EXPRESSION_LIMIT = 19;
    this.SMALL_FONT_SIZE_LIMIT = 10;
    this.availableUnits = [];
    this.unit = '';
    this.expression = '';
    this.amount = 0;
    this.showExpressionResult = false;
    this.allowSend = false;
    this.reNr = /^[1234567890\.]$/;
    this.reOp = /^[\*\+\-\/]$/;
  }
  
  ionViewDidLoad() {
    this.processAmount();
    this.setAvailableUnits();
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

  private format(val: string) {
    if (!val) return;

    var result = val.toString();

    if (this.isOperator(_.last(val))) 
      result = result.slice(0, -1);

    return result.replace('x', '*');
  };

  private evaluate(val: string) {
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
    let data: any = {
      recipientType: this.recipientType,
      amount: this.amount,
      addressInfo: this.addressInfo,
      name: this.name,
      email: this.email,
      unit: this.unit.toLocaleLowerCase(),
      coin: this.addressInfo.coin,
      useSendMax: this.useSendMax
    }
    this.navCtrl.push(this.nextView, data);
  }

  private setAvailableUnits(): void {
    let hasBTCWallets = this.profileProvider.getWallets({ coin: 'btc' }).length;
    let hasBCHWallets = this.profileProvider.getWallets({ coin: 'bch' }).length;
    
    if (hasBTCWallets) this.availableUnits.push('BTC');
    if (hasBCHWallets) this.availableUnits.push('BCH');

    const unit = this.configProvider.get().wallet.settings.alternativeIsoCode;
    this.availableUnits.push(unit);
    this.availableUnits.push('BCH'); // TEST
    this.unit = this.availableUnits[0];
  }

  public updateUnit(): void {
    this.availableUnits.slice(0, this.availableUnits.length).join(',');
    this.availableUnits.push(this.availableUnits.shift());
    this.unit = this.availableUnits[0];
  }
}
