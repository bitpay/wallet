import { Component, ViewChild } from '@angular/core';
import { NavController, LoadingController, Slides, Navbar } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

import { EmailPage } from '../email/email';
import { ProfileProvider } from '../../../providers/profile/profile';

@Component({
  selector: 'page-tour',
  templateUrl: 'tour.html',
})
export class TourPage {
  @ViewChild(Slides) slides: Slides;
  @ViewChild(Navbar) navBar: Navbar;

  public currentIndex: number = 0;

  constructor(
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    private logger: Logger,
    private profileProvider: ProfileProvider
  ) {
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad TourPage');
  }

  ngOnInit() {
    this.navBar.backButtonClick = (e: UIEvent) => {
      this.slidePrev();
    }
  }

  slideChanged() {
    this.currentIndex = this.slides.getActiveIndex();
  }

  slidePrev() {
    if (this.currentIndex == 0) this.navCtrl.pop();
    else {
      this.slides.slidePrev();
    }
  }

  slideNext() {
    this.slides.slideNext();
  }

  createDefaultWallet() {
    // TODO for testing
    this.navCtrl.push(EmailPage);
    return;

    let loading = this.loadingCtrl.create({
      content: 'Creating Personal Wallet...'
    });
    loading.present();

    this.profileProvider.createDefaultWallet().then(() => {
      loading.dismiss();
      this.navCtrl.push(EmailPage);
    })
  }

}
