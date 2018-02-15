import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

// Provider
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { MercadoLibreProvider } from '../../../../providers/mercado-libre/mercado-libre';

@Component({
  selector: 'page-mercado-libre-card-details',
  templateUrl: 'mercado-libre-card-details.html'
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

  public ionViewDidLoad() {
    this.logger.info('ionViewDidLoad MercadoLibreCardDetailsPage');
  }

  public remove(): void {
    this.mercadoLibreProvider.savePendingGiftCard(
      this.card,
      {
        remove: true
      },
      (err: any) => {
        this.close();
      }
    );
  }

  public close(): void {
    this.viewCtrl.dismiss();
  }

  public openExternalLink(url: string): void {
    this.externalLinkProvider.open(url);
  }

  public openRedeemLink() {
    let url;
    const isSandbox =
      this.mercadoLibreProvider.getNetwork() == 'testnet' ? true : false;
    if (isSandbox) {
      url = 'https://beta.mercadolivre.com.br/vale-presente/resgate';
    } else {
      url = 'https://www.mercadolivre.com.br/vale-presente/resgate';
    }
    this.openExternalLink(url);
  }

  public openSupportWebsite(): void {
    const url = 'https://help.bitpay.com/requestHelp';
    const optIn = true;
    const title = null;
    const message = 'A informação de ajuda e suporte está disponível no site.';
    const okText = 'Abrir';
    const cancelText = 'Volte';
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }
}
