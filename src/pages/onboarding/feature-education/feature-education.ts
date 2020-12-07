import { Component, ViewChild } from '@angular/core';
import { NavController, Slides } from 'ionic-angular';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { ConfigProvider } from '../../../providers/config/config';
import { Logger } from '../../../providers/logger/logger';
import { PlatformProvider } from '../../../providers/platform/platform';

// Pages
import { ImportWalletPage } from '../../../pages/add/import-wallet/import-wallet';
import { SelectCurrencyPage } from '../../../pages/add/select-currency/select-currency';
import { LockMethodPage } from '../../../pages/onboarding/lock-method/lock-method';

@Component({
  selector: 'page-feature-education',
  templateUrl: 'feature-education.html'
})
export class FeatureEducationPage {
  @ViewChild('featureEducationSlides')
  featureEducationSlides: Slides;
  public isCordova: boolean;

  private pageMap = {
    SelectCurrencyPage,
    ImportWalletPage
  };
  private params = {
    isOnboardingFlow: true,
    isZeroState: true
  };

  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private actionSheetProvider: ActionSheetProvider,
    private configProvider: ConfigProvider,
    private platformProvider: PlatformProvider
  ) {
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: FeatureEducationPage');
  }

  ionViewWillLoad() {
    this.featureEducationSlides.lockSwipeToPrev(true);
  }

  public slideChanged() {
    // Disable first bounce
    let currentIndex = this.featureEducationSlides.getActiveIndex();
    currentIndex == 0
      ? this.featureEducationSlides.lockSwipeToPrev(true)
      : this.featureEducationSlides.lockSwipeToPrev(false);
  }

  public goToNextPage(nextViewName: string): void {
    const config = this.configProvider.get();
    if ((config.lock && config.lock.method) || !this.isCordova)
      this.navCtrl.push(this.pageMap[nextViewName], this.params);
    else this.showInfoSheet(nextViewName);
  }

  private showInfoSheet(nextViewName: string): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet('protect-money');
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) this.goToLockMethodPage(nextViewName);
    });
  }

  private goToLockMethodPage(name: string): void {
    let nextView = {
      name,
      params: this.params
    };
    this.navCtrl.push(LockMethodPage, { nextView });
  }
}
