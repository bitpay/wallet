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

  public nextSlide(): void {
    this.walletGroupOnboardingSlides.slideNext();
  }

  public close(): void {
    this.viewCtrl.dismiss();
  }
}
