import { Component } from '@angular/core';

// Providers
import { animate, style, transition, trigger } from '@angular/animations';
import { Events } from 'ionic-angular';
import { AppProvider } from '../../providers/app/app';
import { BitPayCardProvider } from '../../providers/bitpay-card/bitpay-card';
import { BitPayProvider } from '../../providers/bitpay/bitpay';
import { GiftCardProvider } from '../../providers/gift-card/gift-card';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { IABCardProvider } from '../../providers/in-app-browser/card';
import {
  Network,
  PersistenceProvider
} from '../../providers/persistence/persistence';
import { TabProvider } from '../../providers/tab/tab';

@Component({
  selector: 'page-cards',
  templateUrl: 'cards.html',
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({
          transform: 'translateY(5px)',
          opacity: 0
        }),
        animate('200ms')
      ])
    ])
  ]
})
export class CardsPage {
  public bitpayCardItems;
  public showGiftCards: boolean;
  public showBitPayCard: boolean;
  public activeCards: any;
  public tapped = 0;
  public showBitpayCardGetStarted: boolean;
  public ready: boolean;
  public cardExperimentEnabled: boolean;
  public gotCardItems: boolean = false;
  private NETWORK: string;
  public showDisclaimer: boolean;
  constructor(
    private appProvider: AppProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private bitPayProvider: BitPayProvider,
    private bitPayCardProvider: BitPayCardProvider,
    private giftCardProvider: GiftCardProvider,
    private persistenceProvider: PersistenceProvider,
    private tabProvider: TabProvider,
    private events: Events,
    private iabCardProvider: IABCardProvider
  ) {
    this.persistenceProvider.getCardExperimentFlag().then(status => {
      this.cardExperimentEnabled = status === 'enabled';
    });

    this.NETWORK = this.bitPayProvider.getEnvironment().network;

    this.events.subscribe('updateCards', async () => {
      this.bitpayCardItems = await this.prepareDebitCards();
    });

    this.events.subscribe('bitpayIdDisconnected', async () => {
      this.gotCardItems = false;
    });
  }

  async ionViewWillEnter() {
    this.showGiftCards = this.homeIntegrationsProvider.shouldShowInHome(
      'giftcards'
    );
    this.showBitpayCardGetStarted = this.homeIntegrationsProvider.shouldShowInHome(
      'debitcard'
    );
    this.showBitPayCard = !!this.appProvider.info._enabledExtensions.debitcard;

    // get debit cards from persistence storage and process them
    this.bitpayCardItems = await this.prepareDebitCards();
    this.gotCardItems = true;
    // fetch latest
    await this.fetchAllCards();
  }

  private async prepareDebitCards() {
    return new Promise(res => {

      // retrieve cards from storage
      setTimeout(async () => {
        let cards = await this.persistenceProvider.getBitpayDebitCards(
          Network[this.NETWORK]
        );

        // filter out and show one galileo card
        const idx = cards.findIndex(c => {
          return c.provider === 'galileo' && c.cardType === 'physical';
        });

        // if galileo then show disclaimer and remove add card ability
        if (idx !== -1) {
          setTimeout( () => {
            this.showDisclaimer = true;
          }, 300);
          await this.persistenceProvider.setReachedCardLimit(true);
          this.events.publish('reachedCardLimit');
        } else {
          this.showDisclaimer = false;
        }

        cards.splice(idx, 1);

        // filter by show
        cards = cards.filter(c => c.show == true);

        // if all cards hidden
        if (cards.length < 1) {
          // card limit reached
          if (idx !== -1 ) {
            // do not show order now
            this.showBitPayCard = false;
          }
          this.showDisclaimer = false;
        }

        res(cards);
      }, 100);
    });
  }

  private async fetchBitpayCardItems() {
    if (this.cardExperimentEnabled) {
      await this.iabCardProvider.getCards();
    } else {
      this.bitpayCardItems = await this.tabProvider.bitpayCardItemsPromise;

      const updatedBitpayCardItemsPromise = this.bitPayCardProvider.get({
        noHistory: true
      });
      this.bitpayCardItems = await updatedBitpayCardItemsPromise;
      this.tabProvider.bitpayCardItemsPromise = updatedBitpayCardItemsPromise;
    }
    this.gotCardItems = true;
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
          const enableLivenet = confirm('Enable livenet testing?');
          const network = enableLivenet ? 'livenet' : 'testnet';
          this.persistenceProvider.setCardExperimentNetwork(Network[network]);
          alert(
            `Card experiment -> ${
              enableLivenet ? 'livenet enabled' : 'testnet enabled'
            }. Restart the app.`
          );
        }
        this.tapped = 0;
      });
    }
  }
}
