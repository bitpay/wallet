import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

@Component({
  selector: 'page-wallet-balance',
  templateUrl: 'wallet-balance.html'
})
export class WalletBalancePage {
  public status;
  public color: string;

  constructor(private logger: Logger, private navParams: NavParams) {
    this.status = this.navParams.data.status;
    this.color = this.navParams.data.color;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded:  WalletBalancePage');
  }
}
