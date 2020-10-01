import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { AnalyticsProvider } from '../../../providers/analytics/analytics';
import { ConfigProvider } from '../../../providers/config/config';
import { Logger } from '../../../providers/logger/logger';
import { ProfileProvider } from '../../../providers/profile/profile';

// Pages
import { ImportWalletPage } from '../../../pages/add/import-wallet/import-wallet';
import { CoinbasePage } from '../../../pages/integrations/coinbase/coinbase';
import { RecoveryKeyPage } from '../../../pages/onboarding/recovery-key/recovery-key';
import { AmountPage } from '../../../pages/send/amount/amount';
import { TabsPage } from '../../../pages/tabs/tabs';

@Component({
  selector: 'page-add-funds',
  templateUrl: 'add-funds.html'
})
export class AddFundsPage {
  private keyId;
  public needsBackup: boolean;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private analyticsProvider: AnalyticsProvider,
    private configProvider: ConfigProvider,
    private actionSheetProvider: ActionSheetProvider
  ) {
    this.keyId = this.navParams.data.keyId;
    this.needsBackup = this.keyId ? this.checkIfNeedsBackup() : false;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AddFundsPage');
  }

  private checkIfNeedsBackup(): boolean {
    const walletsGroup = this.profileProvider.getWalletGroup(this.keyId);
    return walletsGroup.needsBackup;
  }

  public goToCoinbase(): void {
    this.navCtrl.push(CoinbasePage);
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

  public goToHomePage(): void {
    this.navCtrl.setRoot(TabsPage).then(_ => this.navCtrl.popToRoot());
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
          keyId: this.keyId,
          isOnboardingFlow: false
        });
      }
    });
  }
}
