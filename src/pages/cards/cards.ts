import { ChangeDetectorRef, Component } from '@angular/core';

// Providers
import { animate, style, transition, trigger } from '@angular/animations';
import { Events } from 'ionic-angular';
import { AppProvider } from '../../providers/app/app';
import { BitPayProvider } from '../../providers/bitpay/bitpay';
import { GiftCardProvider } from '../../providers/gift-card/gift-card';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { IABCardProvider } from '../../providers/in-app-browser/card';
import { Logger } from '../../providers/logger/logger';
import {
  Network,
  PersistenceProvider
} from '../../providers/persistence/persistence';
import { PlatformProvider } from '../../providers/platform/platform';
import { TabProvider } from '../../providers/tab/tab';
import { ThemeProvider } from '../../providers/theme/theme';

@Component({
  selector: 'page-cards',
  templateUrl: 'cards.html',
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({
          transform: 'translateY(20px)',
          opacity: 0
        }),
        animate('400ms')
      ])
    ])
  ]
})
export class CardsPage {
  public bitpayCardItems;
  public showGiftCards: boolean;
  public showBitPayCard: boolean = true;
  public activeCards: any;
  public tapped = 0;
  public showBitpayCardGetStarted: boolean;
  public ready: boolean;
  public cardExperimentEnabled: boolean;
  private NETWORK: string;
  public initialized: boolean = false;
  public showDisclaimer: boolean;
  public waitList = true;
  public IABReady: boolean;
  public hasCards: boolean;
  private IABPingLock: boolean;
  private IABPingInterval: any;

  constructor(
    private appProvider: AppProvider,
    private platformProvider: PlatformProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private bitPayProvider: BitPayProvider,
    private giftCardProvider: GiftCardProvider,
    private persistenceProvider: PersistenceProvider,
    private tabProvider: TabProvider,
    private events: Events,
    private iabCardProvider: IABCardProvider,
    private changeRef: ChangeDetectorRef,
    private logger: Logger,
    private themeProvider: ThemeProvider
  ) {
    this.NETWORK = this.bitPayProvider.getEnvironment().network;

    this.bitPayProvider.get(
      '/countries',
      ({ data }) => {
        this.persistenceProvider.setCountries(data);
      },
      () => {}
    );

    this.events.subscribe('showHideUpdate', async status => {
      if (status === 'inProgress') {
        this.initialized = false;
      } else {
        this.bitpayCardItems = await this.prepareDebitCards();
        setTimeout(() => {
          this.initialized = true;
          this.changeRef.detectChanges();
        });
      }
    });

    this.events.subscribe('experimentUpdateStart', async () => {
      this.waitList = false;
      this.changeRef.detectChanges();
    });

    this.events.subscribe('updateCards', async () => {
      this.bitpayCardItems = await this.prepareDebitCards();
      this.changeRef.detectChanges();
    });

    this.events.subscribe('bitpayIdDisconnected', async () => {
      this.hasCards = false;
    });

    this.events.subscribe('IABReady', country => {
      clearInterval(this.IABPingInterval);
      this.logger.log(`cards - IAB ready ${country}`);

      this.persistenceProvider.getCardExperimentFlag().then(status => {
        if (country === 'US' || status === 'enabled') {
          this.persistenceProvider.setCardExperimentFlag('enabled');
          this.cardExperimentEnabled = true;
          this.waitList = false;
        }

        this.initialized = this.IABReady = true;
        this.changeRef.detectChanges();
      });
    });
  }

  async ionViewWillEnter() {
    this.showGiftCards = this.homeIntegrationsProvider.shouldShowInHome(
      'giftcards'
    );
    this.showBitpayCardGetStarted = this.homeIntegrationsProvider.shouldShowInHome(
      'debitcard'
    );

    this.showBitPayCard =
      !(this.appProvider.info._enabledExtensions.debitcard == 'false') &&
      this.platformProvider.isCordova;

    if (
      !this.IABReady &&
      !this.IABPingLock &&
      this.platformProvider.isCordova
    ) {
      this.pingIAB();
    }

    this.bitpayCardItems = await this.prepareDebitCards();
    await this.fetchAllCards();
  }

  private pingIAB() {
    this.IABPingLock = true;
    let attempts = 0;
    this.IABPingInterval = setInterval(() => {
      if (attempts >= 10) {
        clearInterval(this.IABPingInterval);
        this.showBitPayCard = false;
        return;
      }
      this.logger.log(`PINGING IAB attempt ${attempts}`);
      this.iabCardProvider.sendMessage({
        message: 'IABReadyPing',
        payload: {
          appVersion: this.appProvider.info.version,
          theme: this.themeProvider.isDarkModeEnabled()
        }
      });
      attempts++;
    }, 5000);
  }

  private async prepareDebitCards() {
    return new Promise(res => {
      if (!this.platformProvider.isCordova) {
        return res();
      }

      setTimeout(async () => {
        // retrieve cards from storage
        let cards = await this.persistenceProvider.getBitpayDebitCards(
          Network[this.NETWORK]
        );

        this.hasCards = cards.length > 0;

        if (!this.hasCards) {
          return res();
        }

        // sort by provider
        this.iabCardProvider.sortCards(
          cards,
          ['galileo', 'firstView'],
          'provider'
        );

        const hasGalileo =
          cards.findIndex(c => c.provider === 'galileo') !== -1;

        // if all cards are hidden
        if (cards.every(c => !!c.hide)) {
          // if galileo not found then show order card else hide it
          if (!hasGalileo) {
            this.showBitPayCard = true;
            setTimeout(() => {
              this.showDisclaimer = true;
            }, 300);
          } else {
            this.showBitPayCard = this.showDisclaimer = false;
          }

          return res(cards);
        }

        // if galileo then show disclaimer and remove add card ability
        if (hasGalileo) {
          // only show cards that are active and if galileo only show virtual
          cards = cards.filter(
            c =>
              (c.provider === 'firstView' || c.cardType === 'virtual') &&
              c.status === 'active'
          );

          this.waitList = false;

          if (cards.filter(c => !c.hide).find(c => c.provider === 'galileo')) {
            setTimeout(() => {
              this.showDisclaimer = true;
            }, 300);
          } else {
            this.showDisclaimer = false;
          }

          await this.persistenceProvider.setReachedCardLimit(true);
          this.events.publish('reachedCardLimit');
        } else {
          if (this.waitList) {
            // no MC so hide disclaimer
            this.showDisclaimer = false;
          }
        }

        this.showBitPayCard = true;
        res(cards);
      }, 200);
    });
  }

  private async fetchBitpayCardItems() {
    if (this.hasCards && this.platformProvider.isCordova) {
      await this.iabCardProvider.getCards();
    }
  }

  private async fetchActiveGiftCards() {
    this.activeCards = await this.tabProvider.activeGiftCardsPromise;
    const updatedActiveGiftCardsPromise = this.giftCardProvider.getActiveCards();
    this.activeCards = await updatedActiveGiftCardsPromise;
    this.tabProvider.activeGiftCardsPromise = updatedActiveGiftCardsPromise;
  }

  private async fetchAllCards() {
    return Promise.all([
      this.fetchBitpayCardItems(),
      this.fetchActiveGiftCards()
    ]);
  }

  public setCardExperimentHost() {
    this.tapped++;

    if (this.tapped >= 10) {
      this.persistenceProvider.getCardExperimentHost().then(host => {
        if (host) {
          this.persistenceProvider.setCardExperimentHost('');
          alert('Card experiment host disabled. Restart the app.');
        } else {
          this.persistenceProvider.setCardExperimentHost(
            'jwhite.b-pay.net:4200'
          );
          alert('Card experiment host enabled.');
        }
        this.tapped = 0;
      });
    }
  }
}
