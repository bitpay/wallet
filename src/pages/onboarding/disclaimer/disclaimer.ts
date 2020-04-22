import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, Slides } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

import { TabsPage } from '../../tabs/tabs';

import { EmailNotificationsProvider } from '../../../providers/email-notifications/email-notifications';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { PersistenceProvider } from '../../../providers/persistence/persistence';

@Component({
  selector: 'page-disclaimer',
  templateUrl: 'disclaimer.html'
})
export class DisclaimerPage {
  @ViewChild('walletGroupOnboardingSlides')
  walletGroupOnboardingSlides: Slides;

  public accepted;
  public terms;
  public hasEmail: boolean;

  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private emailProvider: EmailNotificationsProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private persistenceProvider: PersistenceProvider,
    private translate: TranslateService
  ) {
    this.hasEmail = this.emailProvider.getEmailIfEnabled() ? true : false;
    this.accepted = {
      first: false,
      second: false,
      third: this.hasEmail ? false : true
    };
    this.terms = {
      accepted: false
    };
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: DisclaimerPage');
  }

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
    if (currentIndex >= 3)
      this.walletGroupOnboardingSlides.lockSwipeToNext(true);
    if (currentIndex < 3)
      this.walletGroupOnboardingSlides.lockSwipeToNext(false);
  }

  public nextSlide(): void {
    this.walletGroupOnboardingSlides.slideNext();
  }

  selectTerms() {
    this.terms.accepted = !this.terms.accepted;
  }

  openDisclaimer() {
    let url = 'https://bitpay.com/about/terms#wallet';
    let optIn = true;
    let title = null;
    let message = this.translate.instant('View Wallet Terms of Use');
    let okText = this.translate.instant('Open');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  openPrivacyPolicy() {
    let url = 'https://bitpay.com/about/privacy';
    let optIn = true;
    let title = null;
    let message = this.translate.instant('View Privacy Policy');
    let okText = this.translate.instant('Open');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  confirm() {
    this.persistenceProvider.setEmailLawCompliance('accepted');
    this.persistenceProvider.setNewDesignSlidesFlag('completed');
    this.persistenceProvider.setDisclaimerAccepted();
    this.navCtrl.setRoot(TabsPage);
    this.navCtrl.popToRoot({ animate: false });
  }
}
