import { Component } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';

// Providers
import { TouchIdProvider } from '../../providers/touchid/touchid';

@Component({
  selector: 'page-fingerprint',
  templateUrl: 'fingerprint.html'
})
export class FingerprintModalPage {
  public unregister;

  constructor(
    private touchid: TouchIdProvider,
    private platform: Platform,
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
