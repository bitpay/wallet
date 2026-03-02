import { Component, ViewChild } from '@angular/core';
import { Slides, ViewController } from 'ionic-angular';

@Component({
  selector: 'page-key-onboarding',
  templateUrl: 'key-onboarding.html'
})
export class KeyOnboardingPage {
  @ViewChild('walletGroupOnboardingSlides')
  walletGroupOnboardingSlides: Slides;

  constructor(private viewCtrl: ViewController) {}

  ionViewWillLoad() {
    this.walletGroupOnboardingSlides.lockSwipeToPrev(true);
  }

  slideChanged() {
    // Disable first and last slides bounce
    let currentIndex = this.walletGroupOnboardingSlides.getActiveIndex();
    if (currentIndex == 0)
      this.walletGroupOnboardingSlides.lockSwipeToPrev(true);
    if (currentIndex > 0)
      this.walletGroupOnboardingSlides.lockSwipeToPrev(false);
    if (currentIndex >= 2)
      this.walletGroupOnboardingSlides.lockSwipeToNext(true);
    if (currentIndex < 2)
      this.walletGroupOnboardingSlides.lockSwipeToNext(false);
  }

  public nextSlide(): void {
    this.walletGroupOnboardingSlides.slideNext();
  }

  public close(): void {
    this.viewCtrl.dismiss();
  }
}
