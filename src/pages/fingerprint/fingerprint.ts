import { Component } from '@angular/core';
import { Platform, ViewController } from 'ionic-angular';
import { TouchIdProvider } from '../../providers/touchid/touchid';

@Component({
  selector: 'page-fingerprint',
  templateUrl: 'fingerprint.html',
})
export class FingerprintModalPage {

  public unregister: any;

  constructor(
    private touchid: TouchIdProvider,
    private viewCtrl: ViewController,
    private platform: Platform
  ) {
    this.unregister = this.platform.registerBackButtonAction(() => { });
    this.checkFingerprint();
  }

  public checkFingerprint(): void {
    this.touchid.check().then(() => {
      setTimeout(() => {
        this.unregister();
        this.viewCtrl.dismiss();
      }, 300);
    });
  }
}
