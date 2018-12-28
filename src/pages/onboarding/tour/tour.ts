import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  LoadingController,
  Navbar,
  NavController,
  Slides
} from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// pages
import { BackupRequestPage } from '../backup-request/backup-request';
// import { CollectEmailPage } from '../collect-email/collect-email';

// providers
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PersistenceProvider } from '../../../providers/persistence/persistence';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { RateProvider } from '../../../providers/rate/rate';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';

@Component({
  selector: 'page-tour',
  templateUrl: 'tour.html'
})
export class TourPage {
  @ViewChild(Slides)
  slides: Slides;
  @ViewChild(Navbar)
  navBar: Navbar;

  public localCurrencySymbol: string;
  public localCurrencyPerBtc: string;
  public currentIndex: number;
  public coins;

  private retryCount: number = 0;

  constructor(
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    private logger: Logger,
    private translate: TranslateService,
    private profileProvider: ProfileProvider,
    private rateProvider: RateProvider,
    private txFormatProvider: TxFormatProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private persistenceProvider: PersistenceProvider,
    private popupProvider: PopupProvider
  ) {
    this.currentIndex = 0;
    this.coins = {
      bitcoin: true,
      bitcoincash: true
    };
    this.rateProvider.whenRatesAvailable('btc').then(() => {
      const btcAmount = 1;
      this.localCurrencySymbol = '$';
      this.localCurrencyPerBtc = this.txFormatProvider.formatAlternativeStr(
        'btc',
        btcAmount * 1e8
      );
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: TourPage');
  }

  ionViewWillEnter() {
    this.navBar.backButtonClick = () => {
      this.slidePrev();
    };
  }

  public slideChanged(): void {
    this.currentIndex = this.slides.getActiveIndex();
  }

  public slidePrev(): void {
    if (this.currentIndex == 0) this.navCtrl.pop();
    else {
      this.slides.slidePrev();
    }
  }

  public slideNext(): void {
    this.slides.slideNext();
  }

  public slideFinal(): void {
    this.slides.slideTo(3);
  }

  public createDefaultVault(): void {
    this.onGoingProcessProvider.set('creatingWallet');
    this.profileProvider
      .createDefaultVault(this.coins)
      .then(walletsArray => {
        this.onGoingProcessProvider.clear();
        this.persistenceProvider.setOnboardingCompleted();
        // this.navCtrl.push(CollectEmailPage, { walletId: wallet.id });
        this.navCtrl.push(BackupRequestPage, { walletId: walletsArray[0].id });
      })
      .catch(err => {
        setTimeout(() => {
          this.logger.warn(
            'Retrying to create default wallet.....:' + ++this.retryCount
          );
          if (this.retryCount > 3) {
            this.onGoingProcessProvider.clear();
            const title = this.translate.instant('Cannot create wallet');
            const okText = this.translate.instant('Retry');
            this.popupProvider.ionicAlert(title, err, okText).then(() => {
              this.retryCount = 0;
              this.createDefaultVault();
            });
          } else {
            this.createDefaultVault();
          }
        }, 2000);
      });
  }
}
