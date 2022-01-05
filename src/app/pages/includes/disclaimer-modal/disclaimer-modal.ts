import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, NavController, NavParams, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AppProvider, EventManagerService } from 'src/app/providers';
import { Coin, CurrencyProvider } from 'src/app/providers/currency/currency';
import { ExternalLinkProvider } from 'src/app/providers/external-link/external-link';
import { Logger } from 'src/app/providers/logger/logger';
import { PersistenceProvider } from 'src/app/providers/persistence/persistence';

// Providers

@Component({
  selector: 'disclaimer-modal',
  templateUrl: 'disclaimer-modal.html',
  styleUrls: ['./disclaimer-modal.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DisclaimerModal {
  public description: string;
  public availableChains: string[];

  private unregisterBackButtonAction;
  public accepted;
  public terms;
  public appName: string;
  navParamsData;

  constructor(
    private currencyProvider: CurrencyProvider,
    private viewCtrl: ModalController,
    private navParams: NavParams,
    public navCtrl: NavController,
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private persistenceProvider: PersistenceProvider,
    private translate: TranslateService,
    private events: EventManagerService,
    private platform: Platform,
    private appProvider: AppProvider,
    private router: Router,
  ) {
    if (this.router.getCurrentNavigation()) {
      this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData = history ? history.state : undefined;
    }
    this.appName = this.appProvider.info.nameCase;

    this.accepted = {
      first: false,
      second: false,
      third: false
    };
    this.terms = {
      accepted: false
    };
  }

  ngOnInit() {
    this.logger.info('Loaded: DisclaimerPage');
  }
  ionViewWillLeave() {
    this.unregisterBackButtonAction && this.unregisterBackButtonAction();
  }

  selectTerms() {
    this.terms.accepted = !this.terms.accepted;
  }

  openDisclaimer() {
    let url = 'https://bitpay.com/legal/terms-of-use/#wallet-terms-of-use';
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

  confirm() {
    this.persistenceProvider.setEmailLawCompliance('accepted');
    this.persistenceProvider.setDisclaimerAccepted();
    this.persistenceProvider.setOnboardingFlowFlag('enabled');
    this.persistenceProvider.getCardFastTrackEnabled().then(context => {
      if (context) {
        this.persistenceProvider.setCardExperimentFlag('enabled');
        setTimeout(() => {
          this.events.publish('experimentUpdateStart');
          setTimeout(() => {
            this.events.publish('experimentUpdateComplete');
          }, 300);
        }, 400);
      }
    });
    this.navCtrl.navigateRoot([''], {
      replaceUrl: true
    });
  }
}
