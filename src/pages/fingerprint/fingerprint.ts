import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';
import { TouchIdProvider } from '../../providers/touchid/touchid';

@Component({
  selector: 'page-fingerprint',
  templateUrl: 'fingerprint.html',
})
export class FingerprintModalPage {

  public showScanButton: boolean;

  constructor(
    private touchid: TouchIdProvider,
    private viewCtrl: ViewController
  ) {
    this.checkFingerprint();
  }

  public checkFingerprint(): void {
    this.showScanButton = true;
    this.touchid.check().then(() => {
      setTimeout(() => {
        this.viewCtrl.dismiss();
      }, 300);
    }).catch(() => {
      this.showScanButton = false;
    });
  }
}
