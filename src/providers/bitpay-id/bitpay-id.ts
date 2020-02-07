import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Logger } from '../../providers/logger/logger';

// providers
import { Device } from '@ionic-native/device';
import * as bitauthService from 'bitauth';
import { User } from '../../models/user/user.model';
import { AppIdentityProvider } from '../app-identity/app-identity';
import { InAppBrowserProvider } from '../in-app-browser/in-app-browser';
import { Network, PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';

@Injectable()
export class BitPayIdProvider {
  private NETWORK: string;
  private BITPAY_API_URL: string;
  private deviceName = 'unknown device';

  constructor(
    private http: HttpClient,
    private appIdentityProvider: AppIdentityProvider,
    private logger: Logger,
    private device: Device,
    private platformProvider: PlatformProvider,
    private persistenceProvider: PersistenceProvider,
    private iab: InAppBrowserProvider
  ) {
    this.logger.debug('BitPayProvider initialized');

    this.NETWORK = 'livenet';
    this.BITPAY_API_URL =
    this.NETWORK == 'livenet'
      ? 'https://bitpay.com'
      : 'https://test.bitpay.com';
    if (this.platformProvider.isElectron) {
      this.deviceName = this.platformProvider.getOS().OSName;
    } else if (this.platformProvider.isCordova) {
      this.deviceName = this.device.model;
    }
  }

  public getEnvironment() {
    return {
      network: this.NETWORK
    };
  }

  public generatePairingToken(secret, successCallback, errorCallback) {
    const network = Network[this.getEnvironment().network];

    this.appIdentityProvider.getIdentity(network, (err, appIdentity) => {
      if (err) {
        alert(err);
        return errorCallback(err);
      }

      let json: any = {
        method: 'createToken',
        params: {
          secret,
          version: 2,
          deviceName: this.deviceName
        }
      };

      let dataToSign = JSON.stringify(json['params']);
      let signedData = bitauthService.sign(dataToSign, appIdentity.priv);

      bitauthService.verifySignature(
        dataToSign,
        appIdentity.pub,
        signedData,

        async () => {
          json['params'].signature = bitauthService.sign(
            dataToSign,
            appIdentity.priv
          );
          json['params'].pubkey = appIdentity.pub;
          json['params'] = JSON.stringify(json.params);

          const url = `${this.BITPAY_API_URL}/api/v2/`;
          let headers = new HttpHeaders().set(
            'content-type',
            'application/json'
          );

          try {
            const token: { data?: string } = await this.http
              // @ts-ignore
              .post(url, json, { headers })
              .toPromise();

            this.logger.debug('BitPayID: successfully paired');

            json = {
              method: 'getBasicInfo',
              token: token.data
            };

            dataToSign = `${url}${token.data}${JSON.stringify(json)}`;

            signedData = bitauthService.sign(dataToSign, appIdentity.priv);

            headers = headers.append('x-identity', appIdentity.pub);
            headers = headers.append('x-signature', signedData);

            const user: User = await this.http
              .post(`${url}${token.data}`, json, { headers })
              .toPromise();

            if (user) {
              const { data } = user;
              const { email, familyName, givenName } = data;

              await Promise.all([
                this.persistenceProvider.setBitPayIdPairingToken(
                  network,
                  token.data
                ),
                // TODO remove this
                this.persistenceProvider.setBitPayIdUserInfo(network, data),
                this.persistenceProvider.setBitpayAccount(network, {
                  email,
                  token: token.data,
                  familyName: familyName || '',
                  givenName: givenName || ''
                })
              ]);

              successCallback(data);
            }
          } catch (err) {
            errorCallback(err);
          }
        },
        err => {
          errorCallback(err);
        }
      );
    });
  }

  public async disconnectBitPayID(successCallback, errorCallback) {
    const network = Network[this.getEnvironment().network];

    // @ts-ignore
    const user: any = await this.persistenceProvider.getBitPayIdUserInfo(
      network
    );
    // TODO add in logic to remove all cards

    try {
      await Promise.all([
        this.persistenceProvider.removeBitPayIdPairingToken(network),
        this.persistenceProvider.removeBitPayIdUserInfo(network)
        // TODO leave commented for the time being
        // this.persistenceProvider.removeBitpayAccount(network, user.email)
      ]);
      this.iab.refs.card.executeScript(
        {
          code: `window.postMessage(${JSON.stringify({
            message: 'bitpayIdDisconnected'
          })}, '*')`
        },
        () => {
          successCallback();
        }
      );
    } catch (err) {
      errorCallback(err);
    }
  }
}
