import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

// Pages
import { AmountPage } from '../../send/amount/amount';
import { MercadoLibreCardsPage } from './mercado-libre-cards/mercado-libre-cards';

// Providers
import { MercadoLibreProvider } from '../../../providers/mercado-libre/mercado-libre';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';

@Component({
  selector: 'page-mercado-libre',
  templateUrl: 'mercado-libre.html',
})
export class MercadoLibrePage {

  public giftCards: any;
  public network: string;

  constructor(
    private navCtrl: NavController,
    private mercadoLibreProvider: MercadoLibreProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger
  ) {
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad MercadoLibrePage');
  }

  ionViewWillEnter(): void {
    this.network = this.mercadoLibreProvider.getNetwork();
    this.init();
  }

  public openExternalLink(url: string): void {
    this.externalLinkProvider.open(url);
  }

  private init(): void {
    this.mercadoLibreProvider.getPendingGiftCards((err: any, gcds: any) => {
      if (err) this.logger.error(err);
      this.giftCards = gcds;
    });
  }

  public goTo(page: string): void {
    switch (page) {
      case 'Amount':
        this.navCtrl.push(AmountPage, {
          nextPage: 'BuyMercadoLibrePage',
          currency: 'BRL',
          coin: 'btc',
          fixedUnit: true,
        });
        break;
      case 'MercadoLibreCards':
        this.navCtrl.push(MercadoLibreCardsPage, {
          invoiceId: null
        });
        break;
    }
  }

}
