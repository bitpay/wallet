import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

// Provider
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { MercadoLibreProvider } from '../../../../providers/mercado-libre/mercado-libre';
import { TimeProvider } from '../../../../providers/time/time';

@Component({
  selector: 'page-mercado-libre-card-details',
  templateUrl: 'mercado-libre-card-details.html'
})
export class MercadoLibreCardDetailsPage {
  public card;
  public isOldCard: boolean;

  constructor(
    private mercadoLibreProvider: MercadoLibreProvider,
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private navParams: NavParams,
    private viewCtrl: ViewController,
    private timeProvider: TimeProvider
  ) {
    this.card = this.navParams.data.card;
    this.isOldCard = !this.timeProvider.withinPastDay(this.card.date);
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad MercadoLibreCardDetailsPage');
  }

  public remove(): void {
    this.mercadoLibreProvider.savePendingGiftCard(
      this.card,
      {
        remove: true
      },
      () => {
        this.close();
      }
    );
  }

  public archive(): void {
    this.mercadoLibreProvider.savePendingGiftCard(
      this.card,
      {
        archived: true
      },
      () => {
        this.logger.debug('Mercado Libre Gift Card archived');
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
    const url =
      this.mercadoLibreProvider.getNetwork() === 'testnet'
        ? 'https://beta.mercadolivre.com.br/vale-presente/resgate'
        : 'https://www.mercadolivre.com.br/vale-presente/resgate';
    this.openExternalLink(url);
  }

  public openSupportWebsite(): void {
    let url = 'https://help.bitpay.com/requestHelp';
    let optIn = true;
    let title = null;
    let message = 'A informação de ajuda e suporte está disponível no site.';
    let okText = 'Abrir';
    let cancelText = 'Volte';
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
