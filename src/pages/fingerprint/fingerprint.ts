import { Component } from '@angular/core';
import { Platform, ViewController } from 'ionic-angular';
import { ThemeProvider } from '../../providers';

// Providers
import { TouchIdProvider } from '../../providers/touchid/touchid';

@Component({
  selector: 'page-fingerprint',
  templateUrl: 'fingerprint.html'
})
export class FingerprintModalPage {
  public unregister;
  public isDarkTheme: boolean;
  constructor(
    private touchid: TouchIdProvider,
    private platform: Platform,
    private viewCtrl: ViewController,
    private themeProvider: ThemeProvider
  ) {
    this.unregister = this.platform.registerBackButtonAction(() => {});
    this.checkFingerprint();
    // Get Theme
    this.isDarkTheme = this.themeProvider.currentAppTheme === 'dark';
  }

  public checkFingerprint(): void {
    this.touchid.check().then(() => {
      this.unregister();
      this.viewCtrl.dismiss();
    });
  }
}
