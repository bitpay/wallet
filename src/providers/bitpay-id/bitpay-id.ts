import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, ViewChild } from '@angular/core';
import { Nav } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// providers
import { Device } from '@ionic-native/device';
import * as bitauthService from 'bitauth';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../models/user/user.model';
import { AppIdentityProvider } from '../app-identity/app-identity';
import { Network, PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';

@Injectable()
export class BitPayIdProvider {
  @ViewChild(Nav) nav: Nav;
  private NETWORK: string;
  private BITPAY_API_URL: string;
  private deviceName = 'unknown device';
  private userSubject = new BehaviorSubject<User>({});
  public userObs$: Observable<User>;

  constructor(
    private http: HttpClient,
    private appIdentityProvider: AppIdentityProvider,
    private logger: Logger,
    private device: Device,
    private platformProvider: PlatformProvider,
    private persistenceProvider: PersistenceProvider
  ) {
    this.logger.debug('BitPayProvider initialized');

    this.NETWORK = 'livenet';
    this.BITPAY_API_URL = 'https://10.10.10.189:8088';
    // this.NETWORK == 'livenet'
    //   ? 'https://bitpay.com'
    //   : 'https://test.bitpay.com';
    if (this.platformProvider.isElectron) {
      this.deviceName = this.platformProvider.getOS().OSName;
    } else if (this.platformProvider.isCordova) {
      this.deviceName = this.device.model;
    }

    this.userObs$ = this.userSubject.asObservable();
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

      const json: any = {
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
        () => {
          json['params'].signature = bitauthService.sign(
            JSON.stringify(json['params']),
            appIdentity.priv
          );
          json['params'].pubkey = appIdentity.pub;
          json['params'] = JSON.stringify(json.params);

          const url = `${this.BITPAY_API_URL}/api/v2/`;
          let headers = new HttpHeaders().set(
            'content-type',
            'application/json'
          );

          this.http
            .post(url, json, { headers })
            .toPromise()
            .then(
              (token: { data: string }) => {
                this.logger.debug('BitPayID: successfully paired');
                const json = {
                  method: 'getBasicInfo',
                  token: token.data
                };

                dataToSign = `${url}${token.data}${JSON.stringify(json)}`;

                signedData = bitauthService.sign(dataToSign, appIdentity.priv);

                headers = headers.append('x-identity', appIdentity.pub);
                headers = headers.append('x-signature', signedData);

                this.http
                  .post(`${url}${token.data}`, json, { headers })
                  .toPromise()
                  .then(
                    async (user: any) => {
                      if (user) {
                        this.logger.debug(
                          'BitPayID: retrieved user basic info'
                        );

                        const { data } = user;

                        try {
                          await Promise.all([
                            this.persistenceProvider.setBitPayIdPairingToken(
                              network,
                              token.data
                            ),
                            this.persistenceProvider.setBitPayIdUserInfo(
                              network,
                              data
                            )
                          ]);

                          successCallback(data);
                        } catch (err) {
                          this.logger.log(err);
                        }
                      }
                    },
                    err => {
                      errorCallback(err);
                    }
                  );
              },
              err => {
                errorCallback(err);
              }
            );
        },
        err => {
          errorCallback(err);
        }
      );
    });
  }

  public async disconnectBitPayID(successCallback, errorCallback) {
    const network = Network[this.getEnvironment().network];
    try {
      await Promise.all([
        this.persistenceProvider.removeBitPayIdPairingToken(network),
        this.persistenceProvider.removeBitPayIdUserInfo(network)
      ]);
      successCallback();
    } catch (err) {
      errorCallback(err);
    }
  }
}
