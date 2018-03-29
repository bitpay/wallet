import { Component } from '@angular/core';
import { Events, Platform } from 'ionic-angular';

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
  public showFingerprintModal: boolean;

  constructor(
    private touchid: TouchIdProvider,
    private platform: Platform,
    private appProvider: AppProvider,
    private events: Events
  ) {

    this.events.subscribe('showFingerprintModalEvent', (isCopay) => {
      this.isCopay = isCopay;
      this.showFingerprintModal = true;
      this.unregister = this.platform.registerBackButtonAction(() => { });
      this.checkFingerprint();
    });
  }

  public checkFingerprint(): void {
    this.touchid.check().then(() => {
      setTimeout(() => {
        this.showFingerprintModal = false;
        this.unregister();
        this.events.publish('finishFingerprintModalEvent');
      }, 300);
    });
  }
}
