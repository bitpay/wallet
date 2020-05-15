import { ChangeDetectorRef, Component } from '@angular/core';

// Providers
import { animate, style, transition, trigger } from '@angular/animations';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'ionic-angular';
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../providers/app/app';
import { BitPayCardProvider } from '../../providers/bitpay-card/bitpay-card';
import { BitPayProvider } from '../../providers/bitpay/bitpay';
import { GiftCardProvider } from '../../providers/gift-card/gift-card';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { IABCardProvider } from '../../providers/in-app-browser/card';
import { Logger } from '../../providers/logger/logger';
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
  public waitList: boolean;
  public IABReady: boolean;
  public hasCards: boolean;
  private IABPingLock: boolean;
  private IABPingInterval: any;

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
    private changeRef: ChangeDetectorRef,
    private logger: Logger,
    private actionSheetProvider: ActionSheetProvider,
    private translate: TranslateService
  ) {
    this.persistenceProvider.getCardExperimentFlag().then(status => {
      this.cardExperimentEnabled = status === 'enabled';
    });

    this.NETWORK = this.bitPayProvider.getEnvironment().network;

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

    this.events.subscribe('updateCards', async () => {
      this.bitpayCardItems = await this.prepareDebitCards();
      this.changeRef.detectChanges();
    });

    this.events.subscribe('bitpayIdDisconnected', async () => {
      this.hasCards = false;
    });

    this.events.subscribe('IABReady', async country => {
      clearInterval(this.IABPingInterval);
      // if wait list flag not set retrieve from storage
      if (this.waitList === undefined) {
        this.waitList = country && country !== 'US';
        this.logger.log(`COUNTRY ${country}`);
      }
      this.logger.log(`cards - IAB ready ${country}`);
      this.initialized = this.IABReady = true;
      this.changeRef.detectChanges();
    });
  }

  async ionViewWillEnter() {
    this.showGiftCards = this.homeIntegrationsProvider.shouldShowInHome(
      'giftcards'
    );
    this.showBitpayCardGetStarted = this.homeIntegrationsProvider.shouldShowInHome(
      'debitcard'
    );

    this.showBitPayCard = !(
      this.appProvider.info._enabledExtensions.debitcard == 'false'
    );

    if (!this.IABReady && !this.IABPingLock) {
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
        this.actionSheetProvider
          .createInfoSheet('default-error', {
            msg: this.translate.instant(
              'Uh oh something went wrong! Please try again later.'
            ),
            title: this.translate.instant('Error')
          })
          .present();
        return;
      }
      this.logger.log(`PINGING IAB attempt ${attempts}`);
      this.iabCardProvider.sendMessage({ message: 'IABReadyPing' });
      attempts++;
    }, 5000);
  }

  private async prepareDebitCards() {
    return new Promise(res => {
      setTimeout(async () => {
        // retrieve cards from storage
        let cards = await this.persistenceProvider.getBitpayDebitCards(
          Network[this.NETWORK]
        );

        this.hasCards = cards.length > 0;

        if (!this.hasCards) {
          return res();
        }

        // filter out and show one galileo card
        const galileo = cards.findIndex(c => {
          return c.provider === 'galileo' && c.cardType === 'physical';
        });
        // if all cards are hidden
        if (cards.every(c => !!c.hide)) {
          // if galileo not found then show order card else hide it
          if (galileo === -1) {
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
      }, 200);
    });
  }

  private async fetchBitpayCardItems() {
    if (this.cardExperimentEnabled) {
      if (this.hasCards) {
        await this.iabCardProvider.getCards();
      }
    } else {
      this.bitpayCardItems = await this.tabProvider.bitpayCardItemsPromise;

      const updatedBitpayCardItemsPromise = this.bitPayCardProvider.get({
        noHistory: true
      });
      this.bitpayCardItems = await updatedBitpayCardItemsPromise;
      this.tabProvider.bitpayCardItemsPromise = updatedBitpayCardItemsPromise;
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
