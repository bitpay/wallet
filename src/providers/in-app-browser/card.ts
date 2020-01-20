import { Injectable } from '@angular/core';
import * as bitauthService from 'bitauth';
import { Events } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs';
import { InAppBrowserRef } from '../../models/in-app-browser/in-app-browser-ref.model';
import { User } from '../../models/user/user.model';
import { AppIdentityProvider } from '../../providers/app-identity/app-identity';
import { BitPayIdProvider } from '../../providers/bitpay-id/bitpay-id';
import { InAppBrowserProvider } from '../../providers/in-app-browser/in-app-browser';
import { Logger } from '../../providers/logger/logger';
import { PayproProvider } from '../../providers/paypro/paypro';
import {
  Network,
  PersistenceProvider
} from '../../providers/persistence/persistence';

@Injectable()
export class IABCardProvider {
  private cardIAB_Ref: InAppBrowserRef;
  private NETWORK: string;
  private BITPAY_API_URL: string;

  private user = new BehaviorSubject({});
  public user$ = this.user.asObservable();

  constructor(
    private payproProvider: PayproProvider,
    private logger: Logger,
    private events: Events,
    private bitpayIdProvider: BitPayIdProvider,
    private appIdentityProvider: AppIdentityProvider,
    private persistanceProvider: PersistenceProvider,
    private iab: InAppBrowserProvider
  ) {
    this.NETWORK = 'livenet';
    this.BITPAY_API_URL =
      this.NETWORK == 'livenet'
        ? 'https://10.10.10.189:8088'
        : 'https://10.10.10.189:8088';
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

            const stateParams = {
              payProOptions: details,
              walletCardRedir: true
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
            const token = await this.persistanceProvider.getBitPayIdPairingToken(
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

        default:
          break;
      }
    });
  }
}
