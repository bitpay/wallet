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

import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import {
  Network,
  PersistenceProvider
} from '../../providers/persistence/persistence';
import { BitPayProvider } from '../bitpay/bitpay';
import { SimplexProvider } from '../simplex/simplex';

@Injectable()
export class IABCardProvider {
  private cardIAB_Ref: InAppBrowserRef;
  private NETWORK: string;
  private BITPAY_API_URL: string;

  private _isHidden = true;
  private _pausedState = false;

  public user = new BehaviorSubject({});
  public user$ = this.user.asObservable();

  constructor(
    private payproProvider: PayproProvider,
    private logger: Logger,
    private events: Events,
    private bitpayProvider: BitPayProvider,
    private bitpayIdProvider: BitPayIdProvider,
    private appIdentityProvider: AppIdentityProvider,
    private persistenceProvider: PersistenceProvider,
    private actionSheetProvider: ActionSheetProvider,
    private iab: InAppBrowserProvider,
    private translate: TranslateService,
    private profileProvider: ProfileProvider,
    private simplexProvider: SimplexProvider,
    private onGoingProcess: OnGoingProcessProvider
  ) {}

  public setNetwork(network: string) {
    this.NETWORK = network;
    this.BITPAY_API_URL =
      this.NETWORK == 'livenet'
        ? 'https://bitpay.com'
        : 'https://test.bitpay.com';
    this.logger.log(`card provider initialized with ${this.NETWORK}`);
  }

  async getCards() {
    const json = {
      method: 'getDebitCards'
    };
    try {
      const token = await this.persistenceProvider.getBitPayIdPairingToken(
        Network[this.NETWORK]
      );
      this.bitpayProvider.post(
        '/api/v2/' + token,
        json,
        async res => {
          if (res && res.error) {
            this.logger.error('could not fetch cards');
            return;
          }

          const { data } = res;

          this.logger.info('BitPay Get Debit Cards: SUCCESS');
          const cards = [];

          data.forEach(card => {

            const { eid, id, lastFourDigits, token, status, provider } = card;

            if (!eid || !id || !lastFourDigits || !token) {
              this.logger.warn(
                'BAD data from BitPay card' + JSON.stringify(card)
              );
              return;
            }

            cards.push({
              eid,
              id,
              lastFourDigits,
              token,
              status,
              provider
            });
          });

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

          await this.persistenceProvider.setBitpayDebitCards(
            Network[this.NETWORK],
            user.email,
            cards
          );

          sessionStorage.setItem(
            'cards',
            JSON.stringify(JSON.stringify(cards))
          );
        },
        () => {
          this.logger.error('could not fetch cards');
        }
      );
    } catch (err) {}
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
      switch (event.data.message) {
        /*
         *
         * Handles paying for the card. The IAB generates the invoice id and passes it back here. This method then launches the payment experience.
         *  TODO pass the user back to the the IAB when purchase is completed
         * */

        case 'purchaseAttempt':
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
                hasWallets[option.currency.toLowerCase()] =
                  fundedWallets.length;
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
          break;

        /*
         *
         * This handles the BitPay ID pairing and retrieves user data. It also passes it to the behavior subject.
         *
         * */

        case 'pairing':
          const { params } = event.data;
          this.pairing(params);
          break;

        /*
         *
         * Closes the IAB
         *
         * */

        case 'close':
          this.hide();
          break;

        case 'topup':
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
          break;

        /*
         *
         * This signs graph queries from the IAB then sends it back. The actual request is made from inside the IAB.
         *
         * */

        case 'signRequest':
          try {
            const token = await this.persistenceProvider.getBitPayIdPairingToken(
              Network[this.NETWORK]
            );

            const { query, variables, name } = event.data.params;

            const json = {
              query,
              variables: { ...variables, token }
            };

            this.appIdentityProvider.getIdentity(
              this.NETWORK,
              (err, appIdentity) => {
                if (err) {
                  return;
                }

                const url = `${this.BITPAY_API_URL}/`;
                const dataToSign = `${url}${JSON.stringify(json)}`;
                const signedData = bitauthService.sign(
                  dataToSign,
                  appIdentity.priv
                );

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
              }
            );
          } catch (err) {}

          break;

        /*
         *
         * Fetch cards and update persistence
         *
         * */

        case 'addCard':
          this.getCards();
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

  pairing(params) {
    const { withNotification } = params;

    // set the overall app loading state
    this.onGoingProcess.set('connectingBitPayId');

    // generates pairing token and also fetches user basic info and caches both
    this.bitpayIdProvider.generatePairingToken(
      params,
      async (user: User) => {
        if (user) {
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

          // publish new user
          this.user.next(user);
          // clear out loading state
          setTimeout(() => {
            this.onGoingProcess.clear();
          }, 300);

          // fetch new cards
          this.getCards();
        }
      },
      async err => {
        this.logger.error(`pairing error -> ${err}`);

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

  show(): void {
    if (this.cardIAB_Ref) {
      this.sendMessage({ message: 'iabOpening' });
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
      this.show();
    }

    this._pausedState = false;
  }
}
