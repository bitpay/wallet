import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as bitauthService from 'bitauth';
import { Events } from 'ionic-angular';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { InAppBrowserRef } from '../../models/in-app-browser/in-app-browser-ref.model';
import { User } from '../../models/user/user.model';
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AppIdentityProvider } from '../../providers/app-identity/app-identity';
import { BitPayIdProvider } from '../../providers/bitpay-id/bitpay-id';
import { InAppBrowserProvider } from '../../providers/in-app-browser/in-app-browser';
import { Logger } from '../../providers/logger/logger';
import { PayproProvider } from '../../providers/paypro/paypro';
import { ProfileProvider } from '../profile/profile';

import { HttpClient } from '@angular/common/http';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import {
  Network,
  PersistenceProvider
} from '../../providers/persistence/persistence';
import { SimplexProvider } from '../simplex/simplex';

@Injectable()
export class IABCardProvider {
  private cardIAB_Ref: InAppBrowserRef;
  private NETWORK: string;
  private BITPAY_API_URL: string;
  private fetchLock: boolean;
  public hasCards: boolean;
  private _isHidden = true;
  private _pausedState = false;

  public user = new BehaviorSubject({});
  public user$ = this.user.asObservable();

  constructor(
    private payproProvider: PayproProvider,
    private logger: Logger,
    private events: Events,
    private bitpayIdProvider: BitPayIdProvider,
    private appIdentityProvider: AppIdentityProvider,
    private persistenceProvider: PersistenceProvider,
    private actionSheetProvider: ActionSheetProvider,
    private iab: InAppBrowserProvider,
    private translate: TranslateService,
    private profileProvider: ProfileProvider,
    private simplexProvider: SimplexProvider,
    private onGoingProcess: OnGoingProcessProvider,
    private http: HttpClient,
    private externalLinkProvider: ExternalLinkProvider
  ) {}

  public setNetwork(network: string) {
    this.NETWORK = network;
    this.BITPAY_API_URL =
      this.NETWORK == 'livenet'
        ? 'https://bitpay.com'
        : 'https://test.bitpay.com';
    this.logger.log(`card provider initialized with ${this.NETWORK}`);
  }

  get ref() {
    return this.cardIAB_Ref;
  }

  get isHidden() {
    return this._isHidden;
  }

  get isVisible() {
    return !this._isHidden;
  }

  init(): void {
    this.logger.debug('IABCardProvider initialized');
    this.cardIAB_Ref = this.iab.refs.card;

    this.cardIAB_Ref.events$.subscribe(async (event: any) => {
      this.logger.log(`EVENT FIRED ${JSON.stringify(event.data.message)}`);

      switch (event.data.message) {
        /*
         *
         * Handles paying for the card. The IAB generates the invoice id and passes it back here. This method then launches the payment experience.
         *  TODO pass the user back to the the IAB when purchase is completed
         * */

        case 'purchaseAttempt':
          this.purchaseAttempt(event);
          break;

        /*
         *
         * This handles the BitPay ID pairing and retrieves user data. It also passes it to the behavior subject.
         *
         * */

        case 'pairing':
          this.pairing(event);
          break;

        /*
         *
         * This handles keeping the IAB session storage in sync with the IAB
         *
         * */
        case 'syncCardState':
          this.syncCardState(event);
          break;

        /*
         *
         * Closes the IAB
         *
         * */

        case 'close':
          this.hide();
          break;

        /*
         *
         * Balance update - added this to ensure balances are in sync between the index view and IAB
         *
         * */

        case 'balanceUpdate':
          this.balanceUpdate(event);
          break;

        /*
         *
         * Open external link from the IAB
         *
         * */

        case 'openLink':
          const { url } = event.data.params;
          this.externalLinkProvider.open(url);
          break;

        case 'navigateToCardTabPage':
          this.events.publish('IncomingDataRedir', {
            name: 'CardsPage'
          });
          break;

        case 'topup':
          this.topUp(event);
          break;

        /*
         *
         * This signs graph queries from the IAB then sends it back. The actual request is made from inside the IAB.
         *
         * */

        case 'signRequest':
          this.signRequest(event);
          break;

        /*
         *
         * Fetch cards and update persistence
         *
         * */

        case 'addCard':
          this.getCards();
          break;

        /*
         *
         * From IAB settings toggle hide and show of cards
         *
         * */

        case 'showHide':
          this.toggleShow(event);
          break;

        case 'buyCrypto':
          this.simplexProvider.getSimplex().then(simplexData => {
            const hasData = simplexData && !_.isEmpty(simplexData);
            const nextView = {
              name: hasData ? 'SimplexPage' : 'SimplexBuyPage',
              params: {},
              callback: () => {
                this.hide();
              }
            };

            this.events.publish('IncomingDataRedir', nextView);
          });
          break;

        default:
          break;
      }
    });
  }

  getCards() {
    return new Promise(async (res, rej) => {
      if (this.fetchLock) {
        this.logger.log(`CARD - Get cards already in progress`);
        return res();
      }

      this.logger.log(`CARD - start get cards from network - ${this.NETWORK}`);

      this.fetchLock = true;
      this.events.publish('isFetchingDebitCards', true);

      const token = await this.persistenceProvider.getBitPayIdPairingToken(
        Network[this.NETWORK]
      );

      if (!token) {
        this.fetchLock = false;
        return res();
      }

      const query = `
      query START_GET_CARDS($token:String!) {
        user:bitpayUser(token:$token) {
          cards:debitCards {
            token,
            id,
            nickname,
            currency {
              name
              code
              symbol
              precision
              decimals
            },
            lastFourDigits,
            provider,
            brand,
            status,
            disabled,
            activationDate,
            cardType,
            cardBalance
          }
        }
      }
    `;

      const json = {
        query,
        variables: { token }
      };

      this.appIdentityProvider.getIdentity(
        this.NETWORK,
        async (err, appIdentity) => {
          if (err) {
            return;
          }

          const url = `${this.BITPAY_API_URL}/api/v2/graphql`;
          const dataToSign = `${url}${JSON.stringify(json)}`;
          const signedData = bitauthService.sign(dataToSign, appIdentity.priv);

          const headers = {
            'x-identity': appIdentity.pub,
            'x-signature': signedData
          };
          // appending the double /api/v2/graphql here is required as theres a quirk around using the api v2 middleware to reprocess graph requests
          const { data }: any = await this.http
            .post(`${url}/api/v2/graphql`, json, { headers })
            .toPromise()
            .catch(err => {
              this.logger.error(`CARD FETCH ERROR  ${JSON.stringify(err)}`);
              this.fetchLock = false;
              return rej(err);
            });

          if (data && data.user && data.user.cards) {
            let cards = data.user.cards;
            const user = await this.persistenceProvider.getBitPayIdUserInfo(
              Network[this.NETWORK]
            );

            for (let card of cards) {
              if (card.provider === 'galileo') {
                this.persistenceProvider.setReachedCardLimit(true);
                this.events.publish('reachedCardLimit');
                break;
              }
            }

            let currentCards = await this.persistenceProvider.getBitpayDebitCards(
              Network[this.NETWORK]
            );

            cards = cards.map(c => {
              // @ts-ignore
              const { lockedByUser, hide } =
                (currentCards || []).find(
                  currentCard => currentCard.eid === c.id
                ) || {};

              return {
                ...c,
                hide,
                lockedByUser,
                currencyMeta: c.currency,
                currency: c.currency.code,
                eid: c.id
              };
            });

            await this.persistenceProvider.setBitpayDebitCards(
              Network[this.NETWORK],
              user.email,
              cards
            );
            try {
              this.ref.executeScript(
                {
                  code: `sessionStorage.setItem(
                  'cards',
                  ${JSON.stringify(JSON.stringify(cards))}
                  )`
                },
                () => this.logger.log('added cards')
              );
            } catch (err) {
              this.logger.log(JSON.stringify(err));
            }

            this.fetchLock = false;
            this.events.publish('isFetchingDebitCards', false);
            this.events.publish('updateCards', cards);
            this.logger.log('CARD - success retrieved cards');

            res();
          }
        }
      );
    });
  }

  async balanceUpdate(event) {
    let cards = await this.persistenceProvider.getBitpayDebitCards(
      Network[this.NETWORK]
    );

    if (cards.length < 1) {
      return;
    }

    const { id, balance } = event.data.params;

    cards = cards.map(c => {
      if (c.eid === id) {
        return {
          ...c,
          cardBalance: balance
        };
      }
      return c;
    });

    const user = await this.persistenceProvider.getBitPayIdUserInfo(
      Network[this.NETWORK]
    );

    await this.persistenceProvider.setBitpayDebitCards(
      Network[this.NETWORK],
      user.email,
      cards
    );

    this.events.publish('updateCards');
  }

  async updateCards() {
    await this.getCards();
    setTimeout(() => {
      this.events.publish('updateCards');
    });
  }

  async syncCardState(event) {
    const { cards } = event.data.params;
    const user = await this.persistenceProvider.getBitPayIdUserInfo(
      Network[this.NETWORK]
    );
    await this.persistenceProvider.setBitpayDebitCards(
      Network[this.NETWORK],
      user.email,
      cards
    );
    this.logger.log('CARD synced state');
  }

  async signRequest(event) {
    try {
      const token = await this.persistenceProvider.getBitPayIdPairingToken(
        Network[this.NETWORK]
      );

      const { query, variables, name } = event.data.params;

      const json = {
        query,
        variables: { ...variables, token }
      };

      this.appIdentityProvider.getIdentity(this.NETWORK, (err, appIdentity) => {
        if (err) {
          return;
        }

        const url = `${this.BITPAY_API_URL}/`;
        const dataToSign = `${url}${JSON.stringify(json)}`;
        const signedData = bitauthService.sign(dataToSign, appIdentity.priv);

        const headers = {
          'x-identity': appIdentity.pub,
          'x-signature': signedData
        };

        this.cardIAB_Ref.executeScript(
          {
            code: `window.postMessage('${JSON.stringify({
              url,
              headers,
              json,
              name
            })}', '*')`
          },
          () => this.logger.log(`card - signed request -> ${name}`)
        );
      });
    } catch (err) {}
  }

  async purchaseAttempt(event) {
    const { invoiceId } = event.data.params;

    this.logger.debug('Incoming-data: Handling bitpay invoice');
    try {
      const details = await this.payproProvider.getPayProOptions(
        `${this.BITPAY_API_URL}/i/${invoiceId}`
      );

      let hasWallets = {};
      let availableWallets = [];
      for (const option of details.paymentOptions) {
        const fundedWallets = this.profileProvider.getWallets({
          coin: option.currency.toLowerCase(),
          network: option.network,
          minAmount: option.estimatedAmount
        });
        if (fundedWallets.length === 0) {
          option.disabled = true;
        } else {
          hasWallets[option.currency.toLowerCase()] = fundedWallets.length;
          availableWallets.push(option);
        }
      }

      const stateParams = {
        payProOptions: details,
        walletCardRedir: true,
        hasWallets
      };

      let nextView = {
        name: 'SelectInvoicePage',
        params: stateParams
      };
      this.events.publish('IncomingDataRedir', nextView);
    } catch (err) {
      this.events.publish('incomingDataError', err);
      this.logger.error(err);
    }

    this.hide();
  }

  async toggleShow(event) {
    this.events.publish('showHideUpdate', 'inProgress');
    let cards = await this.persistenceProvider.getBitpayDebitCards(
      Network[this.NETWORK]
    );

    if (cards.length < 1) {
      return;
    }

    const { hide, provider } = event.data.params;
    cards = cards.map(c => (c.provider === provider ? { ...c, hide } : c));
    const user = await this.persistenceProvider.getBitPayIdUserInfo(
      Network[this.NETWORK]
    );

    await this.persistenceProvider.setBitpayDebitCards(
      Network[this.NETWORK],
      user.email,
      cards
    );

    try {
      this.ref.executeScript(
        {
          code: `sessionStorage.setItem(
                  'cards',
                  ${JSON.stringify(JSON.stringify(cards))}
                  )`
        },
        () => this.logger.log('added cards')
      );
    } catch (err) {
      this.logger.log(JSON.stringify(err));
    }

    this.logger.log('CARD - showHideUpdate - complete');
    this.events.publish('showHideUpdate', 'complete');
  }

  topUp(event) {
    const { id, currency } = event.data.params;

    let nextView = {
      name: 'AmountPage',
      params: {
        nextPage: 'BitPayCardTopUpPage',
        currency,
        id,
        card: 'v2'
      }
    };
    this.events.publish('IncomingDataRedir', nextView);
    this.hide();
  }

  async pairing(event) {
    const {
      params,
      params: { withNotification }
    } = event.data;
    // set the overall app loading state
    this.onGoingProcess.set('connectingBitPayId');

    await this.persistenceProvider.removeAllBitPayAccounts(
      Network[this.NETWORK],
    );

    // generates pairing token and also fetches user basic info and caches both
    this.bitpayIdProvider.generatePairingToken(
      params,
      async (user: User) => {
        if (user) {
          this.logger.log(`pairing success -> ${JSON.stringify(user)}`);
          // publish to correct window
          this.events.publish('BitPayId/Connected');

          // if with notification -> connect your bitpay id in settings or pairing from personal dashboard
          if (withNotification) {
            // resets inappbrowser connect state
            this.cardIAB_Ref.executeScript(
              {
                code: `window.postMessage(${JSON.stringify({
                  message: 'reset'
                })}, '*')`
              },
              () => this.logger.log(`card -> reset iab state`)
            );

            // pairing notification
            const infoSheet = this.actionSheetProvider.createInfoSheet(
              'in-app-notification',
              {
                title: 'BitPay ID',
                body: this.translate.instant(
                  'BitPay ID successfully connected.'
                )
              }
            );

            await infoSheet.present();
            // close in app browser
            this.hide();
          }

          // clear out loading state
          setTimeout(() => {
            this.onGoingProcess.clear();
          }, 300);

          // publish new user
          this.user.next(user);

          // fetch new cards
          await this.getCards();

          this.sendMessage({ message: 'pairingSuccess' });
        }
      },
      async err => {
        this.logger.error(`pairing error -> ${err}`);
        this.sendMessage({ message: 'pairingFailed' });
        // clear out loading state
        this.onGoingProcess.clear();
        // close in app browser

        if (withNotification) {
          const errorSheet = this.actionSheetProvider.createInfoSheet(
            'default-error',
            {
              title: 'BitPay ID',
              msg: 'Uh oh, something went wrong please try again later.'
            }
          );

          await errorSheet.present();

          this.hide();
        }
      }
    );
  }

  sendMessage(message: object, cb?: (...args: any[]) => void): void {
    const script = {
      code: `window.postMessage(${JSON.stringify({ ...message })}, '*')`
    };

    this.cardIAB_Ref.executeScript(script, cb);
  }

  hide(): void {
    if (this.cardIAB_Ref) {
      this.sendMessage({ message: 'iabHiding' });
      this.cardIAB_Ref.hide();
      this._isHidden = true;
    }
  }

  show(enableLoadingScreen?: boolean): void {
    if (this.cardIAB_Ref) {
      let message = 'iabOpening';

      if (enableLoadingScreen) {
        message = `${message}?enableLoadingScreen`;
      }

      this.sendMessage({ message });
      this.cardIAB_Ref.show();
      this._isHidden = false;
    }
  }

  pause(): void {
    this._pausedState = this.isVisible;
    this.hide();
  }

  resume(): void {
    if (this._pausedState) {
      if (this.cardIAB_Ref) {
        this.cardIAB_Ref.show();
        this._isHidden = false;
      }
    }

    this._pausedState = false;
  }

  async hasFirstView(): Promise<boolean> {
    const cards = await this.persistenceProvider.getBitpayDebitCards(
      this.NETWORK
    );
    const hasFirstView =
      cards && cards.filter(c => c.provider === 'firstView').length > 0;
    this.logger.log(`CARD - has first view cards = ${hasFirstView}`);
    if (this.cardIAB_Ref) {
      this.cardIAB_Ref.executeScript(
        {
          code: `sessionStorage.setItem(
                  'hasFirstView',
                  ${hasFirstView}
                  )`
        },
        () => this.logger.log('added cards')
      );
    }

    return hasFirstView;
  }
}
