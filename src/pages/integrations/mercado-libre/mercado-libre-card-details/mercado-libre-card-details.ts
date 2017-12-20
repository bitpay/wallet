import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

// Provider
import { MercadoLibreProvider } from '../../../../providers/mercado-libre/mercado-libre';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';

@Component({
  selector: 'page-mercado-libre-card-details',
  templateUrl: 'mercado-libre-card-details.html',
})
export class MercadoLibreCardDetailsPage {

  public card: any;

  constructor(
    private mercadoLibreProvider: MercadoLibreProvider,
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private navParams: NavParams,
    private viewCtrl: ViewController
  ) {
    this.card = this.navParams.data.card;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad MercadoLibreCardDetailsPage');
  }

  public remove(): void {
    this.mercadoLibreProvider.savePendingGiftCard(this.card, {
      remove: true
    }, (err: any) => {
      this.close();
    });
  }

  public close(): void {
    this.viewCtrl.dismiss();
  }

  public openExternalLink(url: string): void {
    this.externalLinkProvider.open(url);
  }

  public openSupportWebsite(): void {
    var url = 'https://help.bitpay.com/requestHelp';
    var optIn = true;
    var title = null;
    var message = 'Help and support information is available at the website.'; //TODO: getTextCatalog
    var okText = 'Open'; //TODO: getTextCatalog
    var cancelText = 'Go Back'; //TODO: getTextCatalog
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  };

}
