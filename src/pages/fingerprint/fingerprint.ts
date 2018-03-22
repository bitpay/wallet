import { Component } from '@angular/core';
import { Platform, ViewController } from 'ionic-angular';

// Providers
import { AppProvider } from '../../providers/app/app';
import { TouchIdProvider } from '../../providers/touchid/touchid';

@Component({
  selector: 'page-fingerprint',
  templateUrl: 'fingerprint.html',
})
export class FingerprintModalPage {

  public unregister: any;
  public isCopay: boolean;

  constructor(
    private touchid: TouchIdProvider,
    private viewCtrl: ViewController,
    private platform: Platform,
    private appProvider: AppProvider
  ) {
    this.unregister = this.platform.registerBackButtonAction(() => { });
    this.checkFingerprint();
    this.isCopay = this.appProvider.info.nameCase == 'Copay' ? true : false;
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
