import { Component, ViewChild } from '@angular/core';
import { Slides, ViewController } from 'ionic-angular';

@Component({
  selector: 'page-wallet-group-onboarding',
  templateUrl: 'wallet-group-onboarding.html'
})
export class WalletGroupOnboardingPage {
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
