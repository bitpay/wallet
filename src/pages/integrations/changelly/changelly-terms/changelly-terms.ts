import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

// Proviers
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { Logger } from '../../../../providers/logger/logger';
import { ThemeProvider } from '../../../../providers/theme/theme';

@Component({
  selector: 'page-changelly-terms',
  templateUrl: 'changelly-terms.html'
})
export class ChangellyTermsPage {
  constructor(
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private viewCtrl: ViewController,
    public themeProvider: ThemeProvider
  ) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: ChangellyTermsPage');
  }

  public close() {
    this.viewCtrl.dismiss();
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }
}
