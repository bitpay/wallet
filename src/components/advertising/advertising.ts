import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';

interface Advertising {
  takeover_image: string;
  takeover_url: string;
}

@Component({
  selector: 'advertising',
  templateUrl: 'advertising.html'
})
export class AdvertisingComponent {
  public advertising: Advertising;
  constructor(
    private externalLinkProvider: ExternalLinkProvider,
    private viewCtrl: ViewController,
    private navParams: NavParams
  ) {
    this.advertising = this.navParams.data.advertising;
  }

  public close(): void {
    this.viewCtrl.dismiss();
  }

  public openInBrowser() {
    this.externalLinkProvider.open(this.advertising.takeover_url);
    this.close();
  }
}
