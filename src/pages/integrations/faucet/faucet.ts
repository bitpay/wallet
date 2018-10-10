import { Component } from '@angular/core';
// import { Events, ModalController, NavController } from 'ionic-angular';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { Logger } from '../../../providers/logger/logger';

@Component({
  selector: 'page-faucet',
  templateUrl: 'faucet.html',
  // styleUrls: ['faucet.scss'],
})
export class FaucetPage {
  public shifts;
  public network: string;

  constructor(
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
  ) {
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad FaucetPage');
  }

  public openExternalLink(url: string): void {
    this.externalLinkProvider.open(url);
  }

}
