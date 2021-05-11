import { Component, Input, OnInit } from '@angular/core';
import { Events, NavController } from 'ionic-angular';
// Providers
import {
  AnalyticsProvider,
  AppProvider,
  IABCardProvider,
  Logger,
  PlatformProvider
} from '../../../../providers';

// Pages
import { animate, style, transition, trigger } from '@angular/animations';
import {
  Network,
  PersistenceProvider
} from '../../../../providers/persistence/persistence';
import { BitPayCardIntroPage } from '../bitpay-card-intro/bitpay-card-intro';
import { PhaseOneCardIntro } from '../bitpay-card-phases/phase-one/phase-one-intro-page/phase-one-intro-page';

@Component({
  selector: 'bitpay-card-home',
  templateUrl: 'bitpay-card-home.html',
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({
          transform: 'translateY(5px)',
          opacity: 0
        }),
        animate('300ms')
      ])
    ]),
    trigger('fade', [
      transition(':enter', [
        style({
          opacity: 0
        }),
        animate('300ms')
      ])
    ]),
    trigger('tileSlideIn', [
      transition(':enter', [
        style({
          transform: 'translateX(10px)',
          opacity: 0
        }),
        animate('300ms ease')
      ])
    ])
  ]
})
export class BitPayCardHome implements OnInit {
  public appName: string;
  public disableAddCard = true;
  public isFetching: boolean;
  public ready: boolean;
  public alreadyOnWaitList: boolean;
  @Input() showBitpayCardGetStarted: boolean;
  @Input() bitpayCardItems: any;
  @Input() cardExperimentEnabled: boolean;
  @Input() waitList: boolean;
  @Input() hasCards: boolean;
  @Input() network: Network;
  @Input() initialized: boolean;

  constructor(
    private appProvider: AppProvider,
    private navCtrl: NavController,
    private iabCardProvider: IABCardProvider,
    private persistenceProvider: PersistenceProvider,
    private analyticsProvider: AnalyticsProvider,
    private logger: Logger,
    private platformProvider: PlatformProvider,
    private events: Events
  ) {
    this.persistenceProvider.getWaitingListStatus().then(status => {
      this.alreadyOnWaitList = !!status;
    });

    this.events.subscribe('reachedCardLimit', () => {
      this.disableAddCard = true;
    });
  }

  ngOnInit() {
    this.appName = this.appProvider.info.userVisibleName;
    this.disableAddCard =
      this.bitpayCardItems &&
      this.bitpayCardItems.find(c => c.provider === 'galileo');
  }

  public goToBitPayCardIntroPage() {
    this.navCtrl.push(this.waitList ? PhaseOneCardIntro : BitPayCardIntroPage);
  }

  public trackBy(index) {
    return index;
  }

  public async runCardAudienceEvents() {
    try {
      let cards = await this.persistenceProvider.getBitpayDebitCards('livenet');
      let physicalCards = cards.filter(
        c => c.cardType == 'physical' && c.provider == 'galileo'
      );
      let virtualCards = cards.filter(c => c.cardType == 'virtual');
      let deviceUUID = await this.platformProvider.getDeviceUUID();

      let hasFundedCard = await this.persistenceProvider.getHasReportedFirebaseHasFundedCard();
      if (!hasFundedCard) {
        let cardHasBalance = cards.some(c => c.cardBalance > 0);
        if (cardHasBalance) {
          this.analyticsProvider.logEvent('has_funded_card', {
            uuid: deviceUUID
          });
          this.persistenceProvider.setHasReportedFirebaseHasFundedCard();
        } else {
          this.analyticsProvider.logEvent('has_not_funded_card', {
            uuid: deviceUUID
          });
        }
      }

      let hasReportedFirebaseHasPhysicalCard = await this.persistenceProvider.getHasReportedFirebaseHasPhysicalCardFlag();
      let hasReportedFirebaseHasVirtualCard = await this.persistenceProvider.getHasReportedFirebaseHasVirtualCardFlag();

      if (!hasReportedFirebaseHasPhysicalCard) {
        if (physicalCards.length > 0) {
          this.analyticsProvider.logEvent('has_physical_card', {
            uuid: deviceUUID
          });
        }
        this.persistenceProvider.setHasReportedFirebaseHasPhysicalCardFlag();
      }

      if (!hasReportedFirebaseHasVirtualCard) {
        if (virtualCards.length > 0) {
          this.analyticsProvider.logEvent('has_virtual_card', {
            uuid: deviceUUID
          });
        }
        this.persistenceProvider.setHasReportedFirebaseHasVirtualCardFlag();
      }
    } catch (e) {
      this.logger.debug(
        'Error occurred during card audience events: ' + e.message
      );
    }
  }

  public async goToCard(cardId) {
    this.runCardAudienceEvents();
    this.iabCardProvider.loadingWrapper(async () => {
      const token = await this.persistenceProvider.getBitPayIdPairingToken(
        this.network
      );
      const email = this.bitpayCardItems[0].email;

      const message = !token
        ? `loadDashboard?${cardId}&${email}`
        : `loadDashboard?${cardId}`;

      this.iabCardProvider.show();
      setTimeout(() => {
        this.iabCardProvider.sendMessage(
          {
            message
          },
          () => {}
        );
      });
    });
  }
}
