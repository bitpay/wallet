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
  private NETWORK = Network.livenet;
  private BITPAY_API_URL = 'https://bitpay.com';
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
              // const { email, familyName, givenName } = data;

              await Promise.all([
                this.persistenceProvider.setBitPayIdPairingToken(
                  network,
                  token.data
                ),
                this.persistenceProvider.setBitPayIdUserInfo(network, data)
                // this.persistenceProvider.setBitpayAccount(network, {
                //   email,
                //   token: token.data,
                //   familyName: familyName || '',
                //   givenName: givenName || ''
                // })
              ]);

              successCallback(data);
            }
          } catch (err) {
            alert(JSON.stringify(err));
            errorCallback(err);
          }
        },
        err => {
          errorCallback(err);
        }
      );
    });
  }

  public async apiCall(method: string, params: any = {}) {
    const url = `${this.BITPAY_API_URL}/api/v2/`;
    const token = await this.persistenceProvider.getBitPayIdPairingToken(
      Network[this.NETWORK]
    );
    const json = {
      method,
      params: JSON.stringify(params),
      token
    };
    const dataToSign = `${url}${token}${JSON.stringify(json)}`;
    const appIdentity = (await this.getAppIdentity()) as any;
    const signedData = bitauthService.sign(dataToSign, appIdentity.priv);

    let headers = new HttpHeaders().set('content-type', 'application/json');
    headers = headers.append('x-identity', appIdentity.pub);
    headers = headers.append('x-signature', signedData);

    const res: any = await this.http
      .post(`${url}${token}`, json, { headers })
      .toPromise();

    if (res && res.error) {
      throw new Error(res.error);
    }
    return res && res.data;
  }

  getAppIdentity() {
    const network = Network[this.getEnvironment().network];
    return new Promise((resolve, reject) => {
      this.appIdentityProvider.getIdentity(network, (err, appIdentity) => {
        if (err) {
          return reject(err);
        }
        resolve(appIdentity);
      });
    });
  }

  public async disconnectBitPayID(successCallback, errorCallback) {
    const network = Network[this.getEnvironment().network];

    // @ts-ignore
    const user: any = await this.persistenceProvider.getBitPayIdUserInfo(
      network
    );

    try {
      await Promise.all([
        this.persistenceProvider.removeBitPayIdPairingToken(network),
        this.persistenceProvider.removeBitPayIdUserInfo(network)
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
