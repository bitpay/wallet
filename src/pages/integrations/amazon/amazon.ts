import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

// Pages
import { AmountPage } from '../../send/amount/amount';

// Providers
import { AmazonProvider } from '../../../providers/amazon/amazon';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';

@Component({
  selector: 'page-amazon',
  templateUrl: 'amazon.html',
})
export class AmazonPage {

  public network: string;
  public giftCards: any;

  constructor(
    private navCtrl: NavController,
    private amazonProvider: AmazonProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger
  ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AmazonPage');
    this.network = this.amazonProvider.getNetwork();
    this.initAmazon();
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }

  public goTo(page: string): void {
    switch (page) {
      case 'Amount':
        this.navCtrl.push(AmountPage, {
          fromIntegration: true,
          integration: 'Amazon',
          fromSend: false,
          currency: 'USD',
          coin: 'btc',
          fixedUnit: true,
        });
        break;
      case 'AmazonCards':
        //push AmazonCards
        break;
    }
  }

  private initAmazon(): void {
    this.amazonProvider.getPendingGiftCards((err: any, gcds: any) => {
      if (err) this.logger.error(err);
      this.giftCards = gcds;
    });
  }

}
