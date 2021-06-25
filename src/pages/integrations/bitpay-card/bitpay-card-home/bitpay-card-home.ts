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
    this.runCardAudienceEvents();
  }

  public goToBitPayCardIntroPage() {
    this.navCtrl.push(this.waitList ? PhaseOneCardIntro : BitPayCardIntroPage);
  }

  public trackBy(index) {
    return index;
  }

  public async runCardAudienceEvents() {
    try {
      const allCards = await this.persistenceProvider.getBitpayDebitCards(
        'livenet'
      );
      const galileoCards = allCards.filter(c => c.provider === 'galileo');
      const hasPhysicalCard = galileoCards.some(c => c.cardType === 'physical');
      const hasVirtualCard = galileoCards.some(c => c.cardType === 'virtual');
      const deviceUUID = await this.platformProvider.getDeviceUUID();
      const hasReportedFirebaseHasFundedCard = await this.persistenceProvider.getHasReportedFirebaseHasFundedCard();

      if (!!galileoCards.length) {
        if (!hasReportedFirebaseHasFundedCard) {
          const cardHasBalance = galileoCards.some(c => c.cardBalance > 0);

          if (cardHasBalance) {
            this.analyticsProvider.logEvent('has_funded_card_2', {
              uuid: deviceUUID
            });
          } else {
            this.analyticsProvider.logEvent('has_not_funded_card_2', {
              uuid: deviceUUID
            });
          }
          await this.persistenceProvider.setHasReportedFirebaseHasFundedCard();
        }

        const hasReportedFirebaseHasPhysicalCard = await this.persistenceProvider.getHasReportedFirebaseHasPhysicalCardFlag();
        const hasReportedFirebaseHasVirtualCard = await this.persistenceProvider.getHasReportedFirebaseHasVirtualCardFlag();

        if (!hasReportedFirebaseHasPhysicalCard) {
          if (hasPhysicalCard) {
            this.analyticsProvider.logEvent('has_physical_card', {
              uuid: deviceUUID
            });
          }
          await this.persistenceProvider.setHasReportedFirebaseHasPhysicalCardFlag();
        }

        if (!hasReportedFirebaseHasVirtualCard) {
          if (hasVirtualCard) {
            this.analyticsProvider.logEvent('has_virtual_card', {
              uuid: deviceUUID
            });
          }
          await this.persistenceProvider.setHasReportedFirebaseHasVirtualCardFlag();
        }
      }
    } catch (e) {
      this.logger.debug(
        'Error occurred during card audience events: ' + e.message
      );
    }
  }

  public async goToCard(cardId) {
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
