import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

// providers
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { Logger } from '../../../../providers/logger/logger';

// pages
import { ImportWalletPage } from '../../../add/import-wallet/import-wallet';

@Component({
  selector: 'page-clear-encrypt-password',
  templateUrl: 'clear-encrypt-password.html'
})
export class ClearEncryptPasswordPage {
  constructor(
    private logger: Logger,
    private navParams: NavParams,
    private navCtrl: NavController,
    private externalLinkProvider: ExternalLinkProvider
  ) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: ClearEncryptPasswordPage');
  }

  public reImportWallets() {
    this.navCtrl.push(ImportWalletPage, { keyId: this.navParams.data.keyId });
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }
}
