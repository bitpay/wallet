import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { AppIdentityProvider } from '../app-identity/app-identity';

@Injectable()
export class BitPayProvider {
  private NETWORK: string;
  private BITPAY_API_URL: string;
  constructor(
    private http: HttpClient,
    private appIdentityProvider: AppIdentityProvider,
    private logger: Logger
  ) {
    console.log('Hello BitPayProvider Provider');
    this.NETWORK = 'livenet';
    this.BITPAY_API_URL = this.NETWORK == 'livenet' ? 'https://bitpay.com' : 'https://test.bitpay.com';
  }

  public getEnvironment() {
    return {
      network: this.NETWORK
    };
  }

  public get(endpoint, successCallback, errorCallback) {
    let url = this.BITPAY_API_URL + endpoint;
    let headers: any = {
      'content-type': 'application/json'
    }
    this.http.get(url, headers).subscribe((data) => {
      successCallback(data);
    }, (data) => {
      errorCallback(data);
    });
  };

  public post(endpoint, json, successCallback, errorCallback) {
    this.appIdentityProvider.getIdentity(this.getEnvironment().network, (err, appIdentity: any) => {
      if (err) {
        return errorCallback(err);
      }

      //var dataToSign = this.BITPAY_API_URL + endpoint + JSON.stringify(json); TODO
      //var signedData = this.bitauthService.sign(dataToSign, appIdentity.priv); TODO
      let url = this.BITPAY_API_URL + endpoint;
      let headers: any = {
        'content-type': 'application/json',
        'x-identity': appIdentity.pub,
        //'x-signature': signedData
      };

      this.http.post(url, json, headers).subscribe((data) => {
        successCallback(data);
      }, (data) => {
        errorCallback(data);
      });
    });
  }

  public postAuth(json, successCallback, errorCallback) {
    this.appIdentityProvider.getIdentity(this.getEnvironment().network, (err, appIdentity) => {
      if (err) {
        return errorCallback(err);
      }

      //json['params'].signature = bitauthService.sign(JSON.stringify(json.params), appIdentity.priv);
      json['params'].pubkey = appIdentity.pub;
      json['params'] = JSON.stringify(json.params);
      let url = this.BITPAY_API_URL + '/api/v2/';
      let headers: any = {
        'content-type': 'application/json',
      };
      this.logger.debug('post auth:' + JSON.stringify(json));

      this.http.post(url, json, headers).subscribe((data: any) => {
        data.appIdentity = appIdentity;
        successCallback(data);
      }, (data) => {
        errorCallback(data);
      });
    });
  };

}
