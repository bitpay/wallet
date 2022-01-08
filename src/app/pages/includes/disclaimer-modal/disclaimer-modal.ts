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
  public accepted;
  public appName: string;
  navParamsData;

  constructor(
    private viewCtrl: ModalController,
    public navCtrl: NavController,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private events: EventManagerService,
    private appProvider: AppProvider,
  ) {
    this.appName = this.appProvider.info.nameCase;
    this.accepted = {
      first: false,
      second: false,
      third: false
    };
  }

  ngOnInit() {
    this.logger.info('Loaded: DisclaimerPage');
  }

  confirm() {
    if(this.accepted.first && this.accepted.second && this.accepted.third){
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
      this.viewCtrl.dismiss({
        isConfirm: true
      });
    }
    
  }
}
