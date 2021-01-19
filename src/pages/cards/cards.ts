import { ChangeDetectorRef, Component } from '@angular/core';

// Providers
import { animate, style, transition, trigger } from '@angular/animations';
import { Events } from 'ionic-angular';

import {
  AppProvider,
  BitPayProvider,
  GiftCardProvider,
  HomeIntegrationsProvider,
  IABCardProvider,
  Logger,
  PersistenceProvider,
  PlatformProvider,
  TabProvider
} from '../../providers';
import { Network } from '../../providers/persistence/persistence';

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
  public tabReady: boolean;
  private fetchLock: boolean;
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
    private logger: Logger
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

    this.events.subscribe('updateCards', async (cards?) => {
      this.bitpayCardItems = await this.prepareDebitCards(cards);
      this.changeRef.detectChanges();
    });

    this.events.subscribe('BitPayId/Disconnected', async () => {
      this.hasCards = false;
    });
  }

  async ionViewWillEnter() {
    this.cardExperimentEnabled =
      (await this.persistenceProvider.getCardExperimentFlag()) === 'enabled';

    if (this.cardExperimentEnabled) {
      this.waitList = false;
    }

    this.showGiftCards = this.homeIntegrationsProvider.shouldShowInHome(
      'giftcards'
    );
    this.showBitpayCardGetStarted = this.homeIntegrationsProvider.shouldShowInHome(
      'debitcard'
    );

    this.showBitPayCard =
      !(this.appProvider.info._enabledExtensions.debitcard == 'false') &&
      this.platformProvider.isCordova;

    this.bitpayCardItems = await this.prepareDebitCards();

    if (!this.tabReady) {
      this.throttledFetchAllCards();
    }

    this.tabReady = this.initialized = this.IABReady = true;
    this.changeRef.detectChanges();
  }

  public refresh(refresher): void {
    setTimeout(() => {
      refresher.complete();
    }, 2000);

    this.throttledFetchAllCards();
  }

  private async prepareDebitCards(force?) {
    this.logger.log('prepare called');
    return new Promise(async res => {
      if (!this.platformProvider.isCordova) {
        return res();
      }
      // retrieve cards from storage
      let cards =
        force ||
        (await this.persistenceProvider.getBitpayDebitCards(
          Network[this.NETWORK]
        ));

      /*
        Adding this check as a safety - intermittently, when storage is getting updated with cards
        a race condition can happen where cards returns an empty array.
      */
      if (this.bitpayCardItems && this.bitpayCardItems.length && !cards.length)
        return res(this.bitpayCardItems);

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

      const hasGalileo = cards.some(c => c.provider === 'galileo');

      // if all cards are hidden
      if (cards.every(c => !!c.hide)) {
        // if galileo not found then show order card else hide it
        if (!hasGalileo) {
          this.showBitPayCard = true;
          this.showDisclaimer = true;
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

        this.showBitpayCardGetStarted = this.waitList = false;

        this.showDisclaimer = !!cards
          .filter(c => !c.hide)
          .find(c => c.provider === 'galileo');
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
    });
  }

  private async fetchBitpayCardItems() {
    if (this.hasCards && this.platformProvider.isCordova) {
      await this.iabCardProvider.getBalances();
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

  private async throttledFetchAllCards() {
    if (this.fetchLock) {
      this.logger.log('CARD - fetch already in progress');
      return;
    }
    this.logger.log('CARD - fetch started');
    this.fetchLock = true;
    await this.fetchAllCards();
    this.logger.log('CARD - fetch complete');
    await new Promise(res => setTimeout(res, 30000));
    this.fetchLock = false;
    this.logger.log('CARD - fetchLock reset');
  }

  public enableCard() {
    this.tapped++;

    if (this.tapped >= 10) {
      this.persistenceProvider.getCardExperimentFlag().then(res => {
        if (res === 'enabled') {
          this.persistenceProvider.removeCardExperimentFlag();
          this.persistenceProvider.setBitpayIdPairingFlag('disabled');
          alert('Card experiment disabled. Restart the app.');
        } else {
          this.persistenceProvider.setCardExperimentFlag('enabled');
          this.persistenceProvider.setBitpayIdPairingFlag('enabled');
          alert('Card experiment enabled.');
        }
        this.tapped = 0;
      });
    }
  }
}
