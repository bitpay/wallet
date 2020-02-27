import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as bitauthService from 'bitauth';
import { Events } from 'ionic-angular';
import { BehaviorSubject, Subscription } from 'rxjs';
import { InAppBrowserRef } from '../../models/in-app-browser/in-app-browser-ref.model';
import { User } from '../../models/user/user.model';
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AppIdentityProvider } from '../../providers/app-identity/app-identity';
import { BitPayIdProvider } from '../../providers/bitpay-id/bitpay-id';
import { InAppBrowserProvider } from '../../providers/in-app-browser/in-app-browser';
import { Logger } from '../../providers/logger/logger';
import { PayproProvider } from '../../providers/paypro/paypro';
import { ProfileProvider } from '../profile/profile';

import {
  Network,
  PersistenceProvider
} from '../../providers/persistence/persistence';
import { BitPayProvider } from '../bitpay/bitpay';

@Injectable()
export class IABCardProvider {
  private cardIAB_Ref: InAppBrowserRef;
  private NETWORK = 'testnet';
  private BITPAY_API_URL = 'https://test.bitpay.com';

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
    private profileProvider: ProfileProvider
  ) {}

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
            return;
          }

          const { data } = res;

          this.logger.info('BitPay Get Debit Cards: SUCCESS');
          const cards = [];

          data.forEach(card => {
            const { eid, id, lastFourDigits, token } = card;

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
              token
            });
          });

          const user = await this.persistenceProvider.getBitPayIdUserInfo(
            Network[this.NETWORK]
          );

          await this.persistenceProvider.setBitpayDebitCards(
            Network[this.NETWORK],
            user.email,
            cards
          );
        },
        () => {}
      );
    } catch (err) {}
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

          this.cardIAB_Ref.hide();
          break;

        /*
         *
         * Pairing only handler -> pair completed from iab
         *
         * */
        case 'pairingOnly':
          const subscription: Subscription = this.user$.subscribe(user => {
            if (Object.entries(user).length === 0) {
              return;
            }

            this.cardIAB_Ref.hide();

            this.cardIAB_Ref.executeScript(
              {
                code: `window.postMessage(${JSON.stringify({
                  message: 'reset'
                })}, '*')`
              },
              () => this.logger.log(`card -> reset iab state`)
            );

            const infoSheet = this.actionSheetProvider.createInfoSheet(
              'in-app-notification',
              {
                title: 'BitPay ID',
                body: this.translate.instant('BitPay ID successfully paired.')
              }
            );
            infoSheet.present();
            subscription.unsubscribe();
          });

          break;

        /*
         *
         * Closes the IAB
         *
         * */

        case 'close':
          this.cardIAB_Ref.hide();
          break;

        /*
         *
         * This handles the BitPay ID pairing and retrieves user data. It also passes it to the behavior subject.
         *
         * */

        case 'pairing':
          const { secret } = event.data.params;
          // generates pairing token and also fetches user basic info and caches both
          this.bitpayIdProvider.generatePairingToken(
            secret,
            (user: User) => {
              if (user) {
                this.getCards();
                this.user.next(user);
              }
            },
            err => this.logger.debug(err)
          );
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

        default:
          break;
      }
    });
  }
}
