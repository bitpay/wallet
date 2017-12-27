import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

@Component({
  selector: 'page-shapeshift-confirm',
  templateUrl: 'shapeshift-confirm.html',
})
export class ShapeshiftConfirmPage {

  private amount;
  private currency;
  private fromWalletId;
  private toWalletId;
  private createdTx;
  private message;
  private configWallet = configService.getSync().wallet;

  public currencyIsoCode = configWallet.settings.alternativeIsoCode;
  public isCordova = platformInfo.isCordova;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ShapeshiftConfirmPage');
  }

}
