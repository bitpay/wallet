import { Component, ViewChild } from '@angular/core';
import {
  LoadingController,
  Navbar,
  NavController,
  Slides
} from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

//pages
import { CollectEmailPage } from '../collect-email/collect-email';

//providers
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { ProfileProvider } from '../../../providers/profile/profile';
import { RateProvider } from '../../../providers/rate/rate';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';

@Component({
  selector: 'page-tour',
  templateUrl: 'tour.html'
})
export class TourPage {
  @ViewChild(Slides) public slides: Slides;
  @ViewChild(Navbar) public navBar: Navbar;

  public localCurrencySymbol: string;
  public localCurrencyPerBtc: string;
  public currentIndex: number;

  constructor(
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private rateProvider: RateProvider,
    private txFormatProvider: TxFormatProvider,
    private onGoingProcessProvider: OnGoingProcessProvider
  ) {
    this.currentIndex = 0;
    this.rateProvider.whenRatesAvailable().then(() => {
      const btcAmount = 1;
      this.localCurrencySymbol = '$';
      this.localCurrencyPerBtc = this.txFormatProvider.formatAlternativeStr(
        'btc',
        btcAmount * 1e8
      );
    });
  }

  public ionViewDidLoad() {
    this.logger.info('ionViewDidLoad TourPage');
  }

  public ionViewWillEnter() {
    this.navBar.backButtonClick = (e: UIEvent) => {
      this.slidePrev();
    };
  }

  public slideChanged(): void {
    this.currentIndex = this.slides.getActiveIndex();
  }

  public slidePrev(): void {
    if (this.currentIndex == 0) {
      this.navCtrl.pop();
    } else {
      this.slides.slidePrev();
    }
  }

  public slideNext(): void {
    this.slides.slideNext();
  }

  public createDefaultWallet(): void {
    this.onGoingProcessProvider.set('creatingWallet', true);
    this.profileProvider.createDefaultWallet().then(wallet => {
      this.onGoingProcessProvider.set('creatingWallet', false);
      this.navCtrl.push(CollectEmailPage, { walletId: wallet.id });
    });
  }
}
