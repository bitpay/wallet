import { Injectable } from '@angular/core';
import { Device } from '@ionic-native/device';
import { TranslateService } from '@ngx-translate/core';
import * as bitauthService from 'bitauth';
import { Events, Platform } from 'ionic-angular';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { InAppBrowserRef } from '../../models/in-app-browser/in-app-browser-ref.model';
import { User } from '../../models/user/user.model';
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AppIdentityProvider } from '../../providers/app-identity/app-identity';
import { AppleWalletProvider } from '../../providers/apple-wallet/apple-wallet';
import { BitPayIdProvider } from '../../providers/bitpay-id/bitpay-id';
import { ConfigProvider } from '../../providers/config/config';
import { InAppBrowserProvider } from '../../providers/in-app-browser/in-app-browser';
import { Logger } from '../../providers/logger/logger';
import { PayproProvider } from '../../providers/paypro/paypro';
import { ProfileProvider } from '../profile/profile';

import { HttpClient } from '@angular/common/http';
import { AnalyticsProvider } from '../../providers/analytics/analytics';
import { AppProvider } from '../../providers/app/app';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import {
  Network,
  PersistenceProvider
} from '../../providers/persistence/persistence';
import { ThemeProvider } from '../../providers/theme/theme';

@Injectable()
export class IABCardProvider {
  private cardIAB_Ref: InAppBrowserRef;
  private NETWORK: string;
  private BITPAY_API_URL: string;
  private fetchLock: boolean;
  public hasCards: boolean;
  private _isHidden = true;
  private _pausedState = false;
  private _balanceUpdateLock: boolean;

  public user = new BehaviorSubject({});
  public user$ = this.user.asObservable();

  constructor(
    private payproProvider: PayproProvider,
    private logger: Logger,
    private events: Events,
    private bitpayIdProvider: BitPayIdProvider,
    private configProvider: ConfigProvider,
    private appIdentityProvider: AppIdentityProvider,
    private persistenceProvider: PersistenceProvider,
    private actionSheetProvider: ActionSheetProvider,
    private iab: InAppBrowserProvider,
    private translate: TranslateService,
    private profileProvider: ProfileProvider,
    private onGoingProcess: OnGoingProcessProvider,
    private http: HttpClient,
    private externalLinkProvider: ExternalLinkProvider,
    private themeProvider: ThemeProvider,
    private appProvider: AppProvider,
    private appleWalletProvider: AppleWalletProvider,
    private platform: Platform,
    private device: Device,
    private analyticsProvider: AnalyticsProvider
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
        case 'log':
          this.logger.debug(event.data.log);
          break;

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
         * IAB Ready event
         *
         * */

        case 'ready':
          this.events.publish('IABReady');
          break;

        /*
         *
         * Sets User location
         *
         * */

        case 'setUserLocation':
          const { country } = event.data.params;
          this.events.publish('IABReady', country);
          if (country) {
            this.persistenceProvider.setUserLocation(country);
          }
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
          const nextView = {
            name: 'AmountPage',
            params: {
              fromBuyCrypto: true,
              nextPage: 'CryptoOrderSummaryPage',
              currency: this.configProvider.get().wallet.settings
                .alternativeIsoCode
            },
            callback: () => {
              this.hide();
            }
          };

          this.events.publish('IncomingDataRedir', nextView);
          break;

        case 'getAppVersion':
          this.sendMessage({
            message: 'getAppVersion',
            payload: this.appProvider.info.version
          });
          break;

        case 'isDarkModeEnabled':
          this.sendMessage({
            message: 'isDarkModeEnabled',
            payload: this.themeProvider.isDarkModeEnabled()
          });
          break;

        case 'updateWalletStatus':
          this.updateWalletStatus();
          break;

        case 'hasWalletWithFunds':
          const hasWalletWithFunds = this.profileProvider.hasWalletWithFunds(
            12,
            'USD'
          );
          this.sendMessage({
            message: 'hasWalletWithFunds',
            payload: hasWalletWithFunds
          });
          break;

        case 'checkProvisioningAvailability':
          this.checkProvisioningAvailability();
          break;

        case 'startAddPaymentPass':
          this.startAddPaymentPass(event);
          break;

        case 'completeAddPaymentPass':
          this.completeAddPaymentPass(event);
          break;

        case 'fbLogEvent':
          this.logEvent(event);
          break;

        default:
          break;
      }
    });
  }

  async checkAppleWallet(cards) {
    return Promise.all(
      cards.map(async card => {
        if (card.cardType === 'virtual') {
          const {
            isInWallet,
            isInWatch
          } = await this.appleWalletProvider.checkPairedDevicesBySuffix(
            card.lastFourDigits
          );

          return {
            ...card,
            isInWallet,
            isInWatch
          };
        }

        return card;
      })
    );
  }

  logEvent(event) {
    const { eventName, params } = event.data.params;
    this.analyticsProvider.logEvent(eventName, params);
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
            pagingSupport,
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
            cardBalance,
            lockedByUser
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
              let { hide } =
                (currentCards || []).find(
                  currentCard => currentCard.eid === c.id
                ) || {};

              if (
                c.disabled ||
                ['lost', 'stolen', 'canceled'].includes(c.status)
              ) {
                hide = true;
              }

              return {
                ...c,
                hide,
                currencyMeta: c.currency,
                currency: c.currency.code,
                eid: c.id
              };
            });

            if (cards.length < 1) {
              this.fetchLock = false;
              return res();
            }

            // if (this.platform.is('ios')) {
            //   cards = this.checkAppleWallet(cards);
            // }

            this.sortCards(cards, ['virtual', 'physical'], 'cardType');
            this.sortCards(cards, ['galileo', 'firstView'], 'provider');

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

  public sortCards(cards: object[], order: string[], key: string) {
    const orderBy = (p: string) => order.indexOf(p) + 1 || order.length + 1;
    cards.sort((a, b) => {
      if (orderBy(a[key]) > orderBy(b[key])) {
        return 1;
      }
      if (orderBy(a[key]) < orderBy(b[key])) {
        return -1;
      }
      return 0;
    });
  }

  async balanceUpdate(event) {
    if (this._balanceUpdateLock) {
      this.logger.log('CARD - balance update already in progress');
      return;
    }

    this._balanceUpdateLock = true;

    let cards = await this.persistenceProvider.getBitpayDebitCards(
      Network[this.NETWORK]
    );

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

    // adding this for possible race conditions
    if (cards.length < 1) {
      this._balanceUpdateLock = false;
      return;
    }

    await this.persistenceProvider.setBitpayDebitCards(
      Network[this.NETWORK],
      user.email,
      cards
    );
    this.events.publish('updateCards');
    this._balanceUpdateLock = false;
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

    if (cards.length < 1) {
      return;
    }

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

  async graphRequest(request): Promise<any> {
    try {
      request = {
        ...request,
        query: request.query.replace(/\r?\n|\r/g, '')
      };

      const token = await this.persistenceProvider.getBitPayIdPairingToken(
        Network[this.NETWORK]
      );

      const { query, variables } = request;

      const json = {
        query,
        variables: { ...variables, token }
      };

      const { priv, pub } = await this.bitpayIdProvider.getAppIdentity();

      let url = `https://bitpay.com/`;
      const dataToSign = `${url}${JSON.stringify(json)}`;
      const signedData = bitauthService.sign(dataToSign, priv);

      const headers = [
        signedData,
        pub
      ];

      return await this.appleWalletProvider.graphRequest(headers, JSON.stringify(json));
    } catch (err) {
      this.logger.log(`graph request failed ${err}`);
    }
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

    const { hide, provider, id } = event.data.params;

    cards = cards.map(c => {
      if ((provider === 'galileo' && c.provider === provider) || c.id === id) {
        return { ...c, hide };
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
      params: { withNotification, dashboardRedirect, paymentUrl }
    } = event.data;
    // set the overall app loading state
    this.onGoingProcess.set('connectingBitPayId');

    await this.persistenceProvider.removeAllBitPayAccounts(
      Network[this.NETWORK]
    );

    // generates pairing token and also fetches user basic info and caches both
    this.bitpayIdProvider.generatePairingToken(
      params,
      async (user: User) => {
        if (user) {
          this.sendMessage({ message: 'pairingSuccess' });

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

            // paymentUrl - so pass to unlock context
            if (paymentUrl) {
              infoSheet.onDidDismiss(() => {
                this.events.publish('unlockInvoice', paymentUrl);
              });
            }

            if (dashboardRedirect) {
              this.events.publish('IncomingDataRedir', {
                name: 'CardsPage'
              });
              this.sendMessage({ message: 'loadDashboard' });
            }
          }

          // publish new user
          this.user.next(user);

          if (!paymentUrl) {
            // fetch new cards
            await this.getCards();
            this.events.publish('updateCards');
          }

          // clear out loading state
          setTimeout(() => {
            this.onGoingProcess.clear();
          }, 300);
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

  setTheme() {
    let message = 'isDarkModeEnabled';
    this.sendMessage({
      message,
      payload: { theme: this.themeProvider.isDarkModeEnabled() }
    });
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

  show(disableLoadingScreen?: boolean): void {
    if (this.cardIAB_Ref) {
      let message = 'iabOpening';

      if (disableLoadingScreen) {
        message = `${message}?enableLoadingScreen`;
      }

      this.setTheme();
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
    const hasFirstView = cards && !!cards.find(c => c.provider === 'firstView');
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

  updateWalletStatus() {
    let wallets = this.profileProvider.wallet;
    if (_.isEmpty(wallets)) {
      this.events.publish('Local/HomeBalance');
      return;
    }

    this.logger.debug('Fetching All Wallets and Updating Total Balance');
    wallets = _.filter(this.profileProvider.wallet, w => {
      return !w.hidden;
    });

    _.each(wallets, wallet => {
      this.events.publish('Local/WalletFocus', {
        walletId: wallet.id,
        force: true
      });
    });
  }

  async checkProvisioningAvailability() {
    try {
      // check if current ios version supports apple wallet
      const isAvailable = await this.appleWalletProvider.available();

      let payload: { isAvailable: boolean; error?: string } = {
        isAvailable
      };

      if (!isAvailable) {
        this.logger.log('appleWallet - startAddPaymentPass - not available');
        payload = {
          ...payload,
          error: `ios version (${this.device.version}) does not support apple wallet`
        };
      }

      this.sendMessage({
        message: 'setProvisioningAvailability',
        payload
      });
    } catch (err) {
      this.logger.error(`appleWallet - checkProvisioningAvailability - ${err}`);
      this.sendMessage({
        message: 'setProvisioningAvailability',
        payload: {
          isAvailable: false,
          error: err
        }
      });
    }
  }

  async startAddPaymentPass(event) {
    /* FROM CARD IAB
     * data - cardholderName, primaryAccountSuffix
     * id - card Id
     * */
    this.logger.debug(
      `appleWallet - startAddPaymentPass - ${JSON.stringify(event)}`
    );
    const { data, id } = event.data.params;

    // for testing purposes
    try {
      const result = await this.appleWalletProvider.checkPairedDevicesBySuffix(
        data.cardSuffix
      );
      this.logger.log(`MDES ${JSON.stringify(result)}`);
    } catch (err) {
      this.logger.log(`MDES checkCard${JSON.stringify(err)}`);
    }

    // ios handler
    if (this.platform.is('ios')) {
      try {
        this.hide();

        const {
          data: certs
        } = await this.appleWalletProvider.startAddPaymentPass(data);

        this.logger.debug('appleWallet - startAddPaymentPass - success');

        const {
          certificateLeaf: cert1,
          certificateSubCA: cert2,
          nonce,
          nonceSignature
        } = certs || {};

        const request = {
          query: `
            mutation START_CREATE_PROVISIONING_REQUEST($token:String!, $csrf:String, $cardId:String!, $input:ProvisionInputType!) {
              user:bitpayUser(token:$token, csrf:$csrf) {
                card:debitCard(cardId:$cardId) {
                  provisioningData:createProvisioningRequest(input:$input) {
                    activationData,
                    encryptedPassData,
                    wrappedKey
                  }
                }
              }
            }
          `,
          variables: {
            cardId: id,
            input: {
              walletProvider: 'apple',
              cert1,
              cert2,
              nonce,
              nonceSignature
            }
          }
        };

        this.logger.debug(`appleWallet - start token graph call`);

        const res = await this.graphRequest(request);

        this.logger.debug(JSON.stringify(res));

        await this.completeAddPaymentPass({ res, id });
      } catch (err) {
        this.logger.error(
          `appleWallet - startAddPaymentPassError - ${JSON.stringify(err)}`
        );
        this.logger.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      }
    }
  }

  async completeAddPaymentPass({ res, id }) {
    /* FROM CARD IAB
     * data - activationData, encryptedPassData, wrappedKey
     * id - card Id
     * */
    this.logger.debug(
      `appleWallet - completeAddPaymentPass - ${JSON.stringify(res)}`
    );

    const {
      user: {
        card: { provisioningData }
      }
    } = res.data;

    const {
      wrappedKey: ephemeralPublicKey,
      activationData,
      encryptedPassData
    } = provisioningData || {};

    try {
      const res = await this.appleWalletProvider.completeAddPaymentPass({
        activationData,
        encryptedPassData,
        ephemeralPublicKey
      });

      const payload =
        res === 'success'
          ? { id }
          : { id, error: 'completeAddPaymentPass failed' };

      this.sendMessage({
        message: 'completeAddPaymentPass',
        payload
      });
      await new Promise(res => setTimeout(res, 300));
      this.cardIAB_Ref.show();
    } catch (err) {
      this.logger.error(`appleWallet - completeAddPaymentPass - ${err}`);
      this.sendMessage({
        message: 'completeAddPaymentPass',
        payload: {
          id,
          error: 'completeAddPaymentPass failed'
        }
      });
      await new Promise(res => setTimeout(res, 300));
      this.cardIAB_Ref.show();
    }
  }
}
