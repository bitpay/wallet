import { Component, ViewChild } from '@angular/core';
import { NavController, Slides } from 'ionic-angular';

// Providers
import { AppProvider } from '../../../providers/app/app';
import { Logger } from '../../../providers/logger/logger';

// Pages
import { KeyCreationPage } from '../../../pages/onboarding/key-creation/key-creation';

@Component({
  selector: 'page-feature-education',
  templateUrl: 'feature-education.html'
})
export class FeatureEducationPage {
  @ViewChild('featureEducationSlides')
  featureEducationSlides: Slides;
  public isCopay: boolean;

  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private appProvider: AppProvider
  ) {
    this.isCopay = this.appProvider.info.name === 'copay';
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

  public nextSlide(): void {
    let currentIndex = this.featureEducationSlides.getActiveIndex();
    currentIndex < 2 && !this.isCopay
      ? this.featureEducationSlides.slideNext()
      : this.goToKeyCreation();
  }

  private goToKeyCreation(): void {
    this.navCtrl.push(KeyCreationPage);
  }
}
