import { Component, ViewChild } from '@angular/core';
import { NavController, LoadingController, Slides, Navbar } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

import { EmailPage } from '../email/email';

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
    private log: Logger
  ) {
  }

  ionViewDidLoad() {
    this.log.info('ionViewDidLoad TourPage');
  }

  ngOnInit() {
    this.navBar.backButtonClick = (e: UIEvent) => {
      this.slidePrev();
    }
  }

  slideChanged() {
    this.currentIndex = this.slides.getActiveIndex();
  }

  skip() {
    this.navCtrl.push(EmailPage);
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
    // TODO replace for bwc method

    let loading = this.loadingCtrl.create({
      content: 'Creating Personal Wallet...'
    });
    loading.present();

    setTimeout(() => {
      loading.dismiss();
      this.navCtrl.push(EmailPage);
    }, 1500);
  }

}
