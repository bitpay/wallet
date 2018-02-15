import { Component } from '@angular/core';
import { NavController, Events } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';

// Pages
import { AmountPage } from './../../../send/amount/amount';

// Providers
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { ShapeshiftProvider } from '../../../../providers/shapeshift/shapeshift';

@Component({
  selector: 'page-shapeshift-shift',
  templateUrl: 'shapeshift-shift.html',
})
export class ShapeshiftShiftPage {

  private walletsBtc: Array<any>;
  private walletsBch: Array<any>;

  public toWallets: Array<any>;
  public fromWallets: Array<any>;
  public fromWallet: any;
  public toWallet: any;
  public rate: number;
  public limit: any;
  public network: string;
  public fromWalletSelectorTitle: string;
  public toWalletSelectorTitle: string;
  public termsAccepted: boolean;

  constructor(
    private events: Events,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private navCtrl: NavController,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider,
    private shapeshiftProvider: ShapeshiftProvider,
    private translate: TranslateService
  ) {
    this.walletsBtc = [];
    this.walletsBch = [];
    this.toWallets = [];
    this.fromWallets = [];
    this.fromWalletSelectorTitle = 'From';
    this.toWalletSelectorTitle = 'To';
    this.termsAccepted = false;
    this.network = this.shapeshiftProvider.getNetwork();

    this.walletsBtc = this.profileProvider.getWallets({
      onlyComplete: true,
      network: this.network,
      coin: 'btc'
    });

    this.walletsBch = this.profileProvider.getWallets({
      onlyComplete: true,
      network: this.network,
      coin: 'bch'
    });

    if (_.isEmpty(this.walletsBtc) || _.isEmpty(this.walletsBch)) {
      this.showErrorAndBack(null, this.translate.instant('No wallets available to use ShapeShift'));
      return;
    }

    this.fromWallets = _.filter(this.walletsBtc.concat(this.walletsBch), (w: any) => {
      // Available cached funds
      if (!w.cachedBalance) return null;
      let hasCachedFunds = w.cachedBalance.match(/0\.00 /gi) ? false : true;
      return hasCachedFunds;
    });

    if (_.isEmpty(this.fromWallets)) {
      this.showErrorAndBack(null, this.translate.instant('No wallets with funds'));
      return;
    }

    this.onFromWalletSelect(this.fromWallets[0]);
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad ShapeshiftShiftPage');
  }

  ionViewDidEnter() {
    this.termsAccepted = false;
  }

  public openTerms() {
    let url = "https://info.shapeshift.io/sites/default/files/ShapeShift_Terms_Conditions%20v1.1.pdf";
    this.externalLinkProvider.open(url);
  }

  private showErrorAndBack(title: string, msg: any): void {
    title = title ? title : this.translate.instant('Error');
    this.logger.error(msg);
    msg = (msg && msg.errors) ? msg.errors[0].message : msg;
    this.popupProvider.ionicAlert(title, msg).then(() => {
      this.navCtrl.pop();
    });
  }

  private showToWallets(): void {
    this.toWallets = this.fromWallet.coin == 'btc' ? this.walletsBch : this.walletsBtc;
    this.onToWalletSelect(this.toWallets[0]);

    let pair = this.fromWallet.coin + '_' + this.toWallet.coin;
    this.shapeshiftProvider.getRate(pair, (err: any, rate: number) => {
      this.rate = rate;

      this.shapeshiftProvider.getMarketInfo(pair, (err: any, limit: any) => {
        this.limit = limit;

        if (this.limit['rate'] == 0 || this.rate['rate'] == 0) {
          let msg = this.translate.instant('ShapeShift is not available at this moment. Please, try again later.');
          this.popupProvider.ionicAlert(null, msg).then(() => {
            this.navCtrl.pop();
          });
          return;
        }
      });
    });
  }

  public onFromWalletSelect(wallet: any): void {
    this.fromWallet = wallet;
    this.showToWallets();
  }

  public onToWalletSelect(wallet: any): void {
    this.toWallet = wallet;
  }

  public setAmount(): void {
    if (!this.termsAccepted) {
      return;
    }
    this.navCtrl.push(AmountPage, {
      nextPage: 'ShapeshiftConfirmPage',
      fixedUnit: true,
      coin: this.fromWallet.coin,
      id: this.fromWallet.id,
      toWalletId: this.toWallet.id,
      shiftMax: this.limit.limit + ' ' + this.fromWallet.coin.toUpperCase(),
      shiftMin: this.limit.minimum + ' ' + this.fromWallet.coin.toUpperCase()
    });
  }

  public showWallets(selector: string): void {
    let walletsForActionSheet: Array<any> = [];
    let selectedWalletId: string;
    let title: string = selector == 'from' ? this.fromWalletSelectorTitle : this.toWalletSelectorTitle
    if (selector == 'from') {
      walletsForActionSheet = this.fromWallets;
      selectedWalletId = this.fromWallet.id;
    } else if (selector == 'to') {
      walletsForActionSheet = this.toWallets;
      selectedWalletId = this.toWallet.id;
    }
    this.events.publish('showWalletsSelectorEvent', walletsForActionSheet, selectedWalletId, title);
    this.events.subscribe('selectWalletEvent', (wallet: any) => {
      if (!_.isEmpty(wallet)) this.onWalletSelect(wallet, selector);
      this.events.unsubscribe('selectWalletEvent');
    });
  }

  public onWalletSelect(wallet: any, selector: string): void {
    if (selector == 'from') {
      this.onFromWalletSelect(wallet);
    } else if (selector == 'to') {
      this.onToWalletSelect(wallet);
    }
  }

}
