import { Component, NgZone, ViewChild, ViewEncapsulation, AfterContentChecked } from '@angular/core';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { ConfigProvider } from '../../../providers/config/config';
import { Logger } from '../../../providers/logger/logger';
import { PlatformProvider } from '../../../providers/platform/platform';

// Pages
import { ExternalLinkProvider } from 'src/app/providers/external-link/external-link';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { SwiperComponent } from 'swiper/angular';
import { Pagination, SwiperOptions } from 'swiper';
import SwiperCore from 'swiper';
import { ThemeProvider } from 'src/app/providers';

SwiperCore.use([Pagination]);
@Component({
  selector: 'page-feature-education',
  templateUrl: 'feature-education.html',
  styleUrls: ['./feature-education.scss']
})
export class FeatureEducationPage {


  @ViewChild('swiper', { static: true }) swiper: SwiperComponent;

  public isCordova: boolean;
  public selectedTheme;
  slideEnd: boolean = false;
  private params = {
    isOnboardingFlow: true,
    isZeroState: true
  };

  config: SwiperOptions = {
    slidesPerView: 1,
    pagination: true,
    speed: 400,
    resistanceRatio: 0
  }
  zone;
  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private actionSheetProvider: ActionSheetProvider,
    private configProvider: ConfigProvider,
    private platformProvider: PlatformProvider,
    private router: Router,
    private themeProvider: ThemeProvider
  ) {
    this.zone = new NgZone({ enableLongStackTrace: false });
    this.isCordova = this.platformProvider.isCordova;
    this.selectedTheme = this.themeProvider.currentAppTheme;
  }
  ngAfterViewInit() {
    this.swiper.swiperRef.allowSlidePrev = true;
  }
  ngOnInit() {
    this.logger.info('Loaded: FeatureEducationPage');
  }

  public slideChanged() {
    // Disable first bounce
    this.zone.run(() => {
      this.swiper.swiperRef.update();
      this.slideEnd = this.swiper.swiperRef.isEnd;
      if (this.swiper.swiperRef.isBeginning) {
        this.swiper.swiperRef.allowSlidePrev = false;
      }
    })
  }

  public goToNextPage(nextViewName: string): void {
    const config = this.configProvider.get();
    if ((config.lock && config.lock.method) || !this.isCordova) {
      const path = nextViewName == 'SelectCurrencyPage' ? '/select-currency' : '/import-wallet';
      this.router.navigate([path], {
        state: this.params
      });
    } else {
      this.showInfoSheet(nextViewName);
    }
  }

  private showInfoSheet(nextViewName: string): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet('protect-money');
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) this.goToLockMethodPage(nextViewName);
    });
  }

  private goToLockMethodPage(name: string): void {
    let nextView = {
      name,
      params: this.params
    };
    this.router.navigate(['/lock-method'], {
      state: {
        nextView
      },
    })
  }

  public openLink(url) {
    this.externalLinkProvider.open(url);
  }
}
