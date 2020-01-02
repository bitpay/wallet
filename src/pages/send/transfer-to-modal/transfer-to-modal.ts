import { Component } from '@angular/core';
import { StatusBar } from '@ionic-native/status-bar';
import { NavParams, ViewController } from 'ionic-angular';

import { PlatformProvider } from '../../../providers/platform/platform';

@Component({
  selector: 'page-transfer-to-modal',
  templateUrl: 'transfer-to-modal.html'
})
export class TransferToModalPage {
  public search: string = '';
  public wallet;
  private isMobile;

  constructor(
    private navParams: NavParams,
    private viewCtrl: ViewController,
    private platformProvider: PlatformProvider,
    private statusBar: StatusBar
  ) {
    this.wallet = this.navParams.data.wallet;
    this.isMobile = this.platformProvider.isMobile;
  }

  ionViewWillEnter() {
    if (this.isMobile) {
      setTimeout(() => this.statusBar.styleLightContent(), 300);
    }
  }

  public close(): void {
    this.viewCtrl.dismiss();
  }
}
