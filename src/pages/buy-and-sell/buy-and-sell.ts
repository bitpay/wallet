import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

//pages
import { GlideraPage } from '../integrations/glidera/glidera';
import { CoinbasePage } from '../integrations/coinbase/coinbase';

//providers
import { BuyAndSellProvider } from '../../providers/buy-and-sell/buy-and-sell';

@Component({
  selector: 'page-buy-and-sell',
  templateUrl: 'buy-and-sell.html'
})
export class BuyAndSellPage {

  public services: any;

  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private buyAndSellProvider: BuyAndSellProvider
  ) {
    this.services = this.buyAndSellProvider.get();
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad BuyAndSellPage');
  }

  public goTo(page): void {
    switch (page) {
      case 'CoinbasePage':
        this.navCtrl.push(CoinbasePage);
        break;
      case 'GlideraPage':
        this.navCtrl.push(GlideraPage);
        break;
    }
  }

}
