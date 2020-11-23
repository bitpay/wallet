import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { AnalyticsProvider } from '../../../providers/analytics/analytics';
import { ConfigProvider } from '../../../providers/config/config';
import { Logger } from '../../../providers/logger/logger';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ProfileProvider } from '../../../providers/profile/profile';

// Pages
import { ImportWalletPage } from '../../../pages/add/import-wallet/import-wallet';
import { CoinbasePage } from '../../../pages/integrations/coinbase/coinbase';
import { RecoveryKeyPage } from '../../../pages/onboarding/recovery-key/recovery-key';
import { AmountPage } from '../../../pages/send/amount/amount';

@Component({
  selector: 'page-add-funds',
  templateUrl: 'add-funds.html'
})
export class AddFundsPage {
  private keyId;
  public needsBackup: boolean;
  public showCoinbase: boolean;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private analyticsProvider: AnalyticsProvider,
    private configProvider: ConfigProvider,
    private actionSheetProvider: ActionSheetProvider,
    private platformProvider: PlatformProvider,
    private viewCtrl: ViewController
  ) {
    this.keyId = this.navParams.data.keyId;
    this.showCoinbase = !this.platformProvider.isMacApp();
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AddFundsPage');
  }

  ionViewWillEnter() {
    this.needsBackup = this.keyId ? this.checkIfNeedsBackup() : false;
  }

  private checkIfNeedsBackup(): boolean {
    const walletsGroup = this.profileProvider.getWalletGroup(this.keyId);
    return walletsGroup.needsBackup;
  }

  public goToCoinbase(): void {
    this.navCtrl.push(CoinbasePage, { isOnboardingFlow: true });
  }

  public goToAmountPage() {
    if (this.needsBackup) {
      this.showInfoSheet();
      return;
    }

    this.analyticsProvider.logEvent('buy_crypto_button_clicked', {});
    this.navCtrl.push(AmountPage, {
      fromBuyCrypto: true,
      nextPage: 'CryptoOrderSummaryPage',
      currency: this.configProvider.get().wallet.settings.alternativeIsoCode
    });
  }

  public close(): void {
    this.viewCtrl.dismiss();
  }

  public goToImportWallet(): void {
    this.navCtrl.push(ImportWalletPage);
  }

  private showInfoSheet() {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'key-verification-required'
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
        this.navCtrl.push(RecoveryKeyPage, {
          keyId: this.keyId
        });
      }
    });
  }
}
