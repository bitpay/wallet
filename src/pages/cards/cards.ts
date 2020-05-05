import { ChangeDetectorRef, Component } from '@angular/core';

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
    private iabCardProvider: IABCardProvider,
    private changeRef: ChangeDetectorRef
  ) {
    this.persistenceProvider.getCardExperimentFlag().then(status => {
      this.cardExperimentEnabled = status === 'enabled';
    });

    this.NETWORK = this.bitPayProvider.getEnvironment().network;

    this.events.subscribe('showHideUpdate', async status => {
      if (status === 'inProgress') {
        this.gotCardItems = false;
      } else {
        this.bitpayCardItems = await this.prepareDebitCards();
        setTimeout(() => {
          this.gotCardItems = true;
          this.changeRef.detectChanges();
        });
      }
    });

    this.events.subscribe('updateCards', async () => {
      this.bitpayCardItems = await this.prepareDebitCards();
      this.changeRef.detectChanges();
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

    // get debit cards from persistence storage and process them
    this.bitpayCardItems = await this.prepareDebitCards();
    this.gotCardItems = true;
    // fetch latest
    await this.fetchAllCards();
  }

  private async prepareDebitCards() {
    return new Promise(res => {
      // if disabled return
      if (this.appProvider.info._enabledExtensions.debitcard == 'false') {
        this.showBitPayCard = false;
        return res([]);
      }

      setTimeout(async () => {
        // retrieve cards from storage
        let cards = await this.persistenceProvider.getBitpayDebitCards(
          Network[this.NETWORK]
        );
        // filter out and show one galileo card
        const galileo = cards.findIndex(c => {
          return c.provider === 'galileo' && c.cardType === 'physical';
        });
        // if all cards are hidden
        if (cards.every(c => !!c.hide)) {
          // if galileo not found then show order card else hide it
          if (galileo === -1) {
            this.showBitPayCard = true;
            setTimeout( () => {
              this.showDisclaimer = true;
            }, 300);
          } else {
            this.showBitPayCard = this.showDisclaimer = false;
          }

          return res(cards);
        }

        // if galileo then show disclaimer and remove add card ability
        if (galileo !== -1) {
          cards.splice(galileo, 1);

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
          // no MC so hide disclaimer
          this.showDisclaimer = false;
        }

        this.showBitPayCard = true;
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
