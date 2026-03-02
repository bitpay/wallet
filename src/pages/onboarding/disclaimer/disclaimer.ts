import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, Platform } from 'ionic-angular';

// Providers
import { AppProvider } from '../../../providers/app/app';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { IABCardProvider } from '../../../providers/in-app-browser/card';
import { Logger } from '../../../providers/logger/logger';
import { PersistenceProvider } from '../../../providers/persistence/persistence';

// Pages
import { TabsPage } from '../../../pages/tabs/tabs';

@Component({
  selector: 'page-disclaimer',
  templateUrl: 'disclaimer.html'
})
export class DisclaimerPage {
  private unregisterBackButtonAction;
  public accepted;
  public terms;
  public appName: string;

  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private persistenceProvider: PersistenceProvider,
    private translate: TranslateService,
    private iabCardProvider: IABCardProvider,
    private events: Events,
    private platform: Platform,
    private appProvider: AppProvider
  ) {
    this.appName = this.appProvider.info.nameCase;

    this.accepted = {
      first: false,
      second: false
    };
    this.terms = {
      accepted: false
    };
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: DisclaimerPage');
    this.initializeBackButtonHandler();
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
        setTimeout(() => {
          this.iabCardProvider.show();
          this.iabCardProvider.sendMessage({
            message: 'debitCardOrder',
            payload: context
          });
        }, 200);
        this.persistenceProvider.setCardExperimentFlag('enabled');
        setTimeout(() => {
          this.events.publish('experimentUpdateStart');
          setTimeout(() => {
            this.events.publish('experimentUpdateComplete');
          }, 300);
        }, 400);
      }
    });
    this.navCtrl.setRoot(TabsPage).then(_ => {
      this.navCtrl.popToRoot();
    });
  }

  private initializeBackButtonHandler(): void {
    this.unregisterBackButtonAction = this.platform.registerBackButtonAction(
      () => {}
    );
  }

  public acceptTerm(term) {
    this.accepted[term] = !this.accepted[term];
  }
}
