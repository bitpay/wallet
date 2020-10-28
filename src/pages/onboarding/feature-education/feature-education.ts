import { Component, ViewChild } from '@angular/core';
import { NavController, Slides } from 'ionic-angular';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../../providers/app/app';
import { Logger } from '../../../providers/logger/logger';

// Pages
import { LockMethodPage } from '../../../pages/onboarding/lock-method/lock-method';

@Component({
  selector: 'page-feature-education',
  templateUrl: 'feature-education.html'
})
export class FeatureEducationPage {
  @ViewChild('featureEducationSlides')
  featureEducationSlides: Slides;
  public appName: string;

  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private appProvider: AppProvider,
    private actionSheetProvider: ActionSheetProvider
  ) {
    this.appName = this.appProvider.info.nameCase;
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

  public showInfoSheet(nextViewName: string): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet('protect-money');
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) this.goToLockMethodPage(nextViewName);
    });
  }

  private goToLockMethodPage(name: string): void {
    let nextView = {
      name,
      params: {
        isOnboardingFlow: true,
        isZeroState: true
      }
    };
    this.navCtrl.push(LockMethodPage, { nextView });
  }
}
