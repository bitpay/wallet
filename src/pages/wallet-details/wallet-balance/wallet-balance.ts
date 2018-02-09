import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

@Component({
  selector: 'page-wallet-balance',
  templateUrl: 'wallet-balance.html',
})
export class WalletBalancePage {

  public status: any;

  constructor(
    private logger: Logger,
    private navParams: NavParams,
    private viewCtrl: ViewController
  ) {
    this.status = this.navParams.data.status;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad WalletBalancePage');
  }

  public close(): void {
    this.viewCtrl.dismiss();
  }

}