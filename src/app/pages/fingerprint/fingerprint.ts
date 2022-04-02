import { Component, ViewEncapsulation } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { ThemeProvider } from 'src/app/providers/theme/theme';
import { TouchIdProvider } from 'src/app/providers/touchid/touchid';

// Providers

@Component({
  selector: 'page-fingerprint',
  templateUrl: 'fingerprint.html',
  styleUrls: ['fingerprint.scss'],
  encapsulation: ViewEncapsulation.None

})
export class FingerprintModalPage {
  public unregister;
  public currentTheme: string;
  constructor(
    private touchid: TouchIdProvider,
    private platform: Platform,
    private viewCtrl: ModalController,
    private themeProvider: ThemeProvider
  ) {
    this.checkFingerprint();
    // Get Theme
    this.currentTheme = this.themeProvider.currentAppTheme;
  }

  public checkFingerprint(): void {
    this.touchid.check().then(() => {
      this.viewCtrl.dismiss();
    });
  }
}
