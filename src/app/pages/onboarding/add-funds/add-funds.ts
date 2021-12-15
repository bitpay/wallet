import { Component, ViewEncapsulation } from '@angular/core';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { AnalyticsProvider } from '../../../providers/analytics/analytics';
import { ConfigProvider } from '../../../providers/config/config';
import { Logger } from '../../../providers/logger/logger';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ProfileProvider } from '../../../providers/profile/profile';

import { ModalController, NavParams } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'page-add-funds',
  templateUrl: 'add-funds.html',
  styleUrls: ['add-funds.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddFundsPage {
  private keyId;
  public needsBackup: boolean;
  public showCoinbase: boolean;

  constructor(
    public router: Router,
    public navParams: NavParams,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private analyticsProvider: AnalyticsProvider,
    private configProvider: ConfigProvider,
    private actionSheetProvider: ActionSheetProvider,
    private platformProvider: PlatformProvider,
    private viewCtrl: ModalController
  ) {
    this.keyId = this.navParams.data.keyId;
    this.showCoinbase = !this.platformProvider.isMacApp();
  }

  ngOnInit() {
    this.logger.info('Loaded: AddFundsPage');
  }

  ionViewWillEnter() {
    this.needsBackup = this.keyId ? this.checkIfNeedsBackup() : false;
  }

  private checkIfNeedsBackup(): boolean {
    const walletsGroup = this.profileProvider.getWalletGroup(this.keyId);
    return walletsGroup.needsBackup;
  }

  public goToAmountPage() {
    if (this.needsBackup) {
      this.showInfoSheet();
      return;
    }

    this.analyticsProvider.logEvent('buy_crypto_button_clicked', {
      from: 'addFundsPage'
    });
    this.router.navigate(['/amount'], {
      state: {
        fromBuyCrypto: true,
        nextPage: 'CryptoOrderSummaryPage',
        currency: this.configProvider.get().wallet.settings.alternativeIsoCode
      }
    });
  }

  public close(): void {
    this.viewCtrl.dismiss();
  }

  public goToImportWallet(): void {
    this.router.navigate(['/import-wallet']);
  }

  private showInfoSheet() {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'key-verification-required'
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
        this.router.navigate(['/recovery-key'], {
          state: {
            keyId: this.keyId
          }
        });
      }
    });
  }
}
