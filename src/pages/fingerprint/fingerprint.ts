import { Component } from '@angular/core';
import { Platform, ViewController } from 'ionic-angular';

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
    private viewCtrl: ViewController
  ) {
    this.unregister = this.platform.registerBackButtonAction(() => {});
    this.checkFingerprint();
  }

  public checkFingerprint(): void {
    this.touchid.check().then(() => {
      this.unregister();
      this.viewCtrl.dismiss();
    });
  }
}
