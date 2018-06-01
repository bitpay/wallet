import { Component } from '@angular/core';
import { Events, NavController, Platform } from 'ionic-angular';

// Providers
import { AppProvider } from '../../providers/app/app';
import { TouchIdProvider } from '../../providers/touchid/touchid';

@Component({
  selector: 'page-fingerprint',
  templateUrl: 'fingerprint.html'
})
export class FingerprintModalPage {
  public unregister: any;

  constructor(
    private touchid: TouchIdProvider,
    private platform: Platform,
    private appProvider: AppProvider,
    private events: Events,
    private navCtrl: NavController
  ) {
    this.unregister = this.platform.registerBackButtonAction(() => {});
    this.checkFingerprint();
  }

  public checkFingerprint(): void {
    this.touchid.check().then(() => {
      this.unregister();
      this.navCtrl.pop({ animate: true });
    });
  }
}
