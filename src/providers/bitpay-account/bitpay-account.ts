import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { PlatformProvider } from '../platform/platform';
import { BitPayProvider } from '../bitpay/bitpay';
import { PopupProvider } from '../popup/popup';
import { PersistenceProvider } from '../persistence/persistence';
import { AppIdentityProvider } from '../app-identity/app-identity';
import { BitPayCardProvider } from '../bitpay-card/bitpay-card';

import * as _ from 'lodash';

@Injectable()
export class BitPayAccountProvider {


  /*
   * Pair this app with the bitpay server using the specified pairing data.
   * An app identity will be created if one does not already exist.
   * Pairing data is provided by an input URI provided by the bitpay server.
   *
   * pairData - data needed to complete the pairing process
   * {
   *   secret: shared pairing secret
   *   email: email address associated with bitpay account
   *   otp: two-factor one-time use password
   * }
   *
   * pairingReason - text string to be embedded into popup message.  If `null` then the reason
   * message is not shown to the UI.
   *   "To {{reason}} you must pair this app with your BitPay account ({{email}})."
   *
   * cb - callback after completion
   *   callback(err, paired, apiContext)
   *
   *   err - something unexpected happened which prevented the pairing
   *
   *   paired - boolean indicating whether the pairing was compledted by the user
   *
   *   apiContext - the context needed for making future api calls
   *   {
   *     token: api token for use in future calls
   *     pairData: the input pair data
   *     appIdentity: the identity of this app
   *   }
   */

  constructor(
    private platformProvider: PlatformProvider,
    private bitPayProvider: BitPayProvider,
    private logger: Logger,
    private popupProvider: PopupProvider,
    private persistenceProvider: PersistenceProvider,
    private appIdentityProvider: AppIdentityProvider,
    private bitPayCardProvider: BitPayCardProvider
  ) {
  }

  public pair(pairData: any, pairingReason: string, cb: Function) {
    this.checkOtp(pairData, (otp) => {
      pairData.otp = otp;
      let deviceName = 'Unknown device';
      if (this.platformProvider.isNW) {
        deviceName = require('os').platform();
      } else if (this.platformProvider.isCordova) {
        //TODO deviceName = this.platformProvider.device.model;
        deviceName = '';
      }
      let json = {
        method: 'createToken',
        params: {
          secret: pairData.secret,
          version: 2,
          deviceName: deviceName,
          code: pairData.otp
        }
      };

      this.bitPayProvider.postAuth(json, (data) => {
        if (data && data.error) {
          return cb(data.error);
        }
        let apiContext = {
          token: data.data,
          pairData: pairData,
          appIdentity: data.appIdentity
        };
        this.logger.info('BitPay service BitAuth create token: SUCCESS');

        this.fetchBasicInfo(apiContext, (err, basicInfo) => {
          if (err) return cb(err);
          let title = 'Add BitPay Account?'; //TODO gettextcatalog
          let msg;

          if (pairingReason) {
            let reason = pairingReason;
            let email = pairData.email;

            msg = 'To ' + reason + ' you must first add your BitPay account - ' + email; //TODO gettextcatalog
          } else {
            let email = pairData.email;
            msg = 'Add this BitPay account ' + '(' + email + ')?'; //TODO gettextcatalog
          }

          let ok = 'Add Account'; //TODO gettextcatalog
          let cancel = 'Go back'; //TODO gettextcatalog
          this.popupProvider.ionicConfirm(title, msg, ok, cancel).then((res) => {
            if (res) {
              let acctData = {
                token: apiContext.token,
                email: pairData.email,
                givenName: basicInfo.givenName,
                familyName: basicInfo.familyName
              };
              this.setBitpayAccount(acctData)
              return cb(null, true, apiContext);
            } else {
              this.logger.info('User cancelled BitPay pairing process');
              return cb(null, false);
            }
          });
        });
      }, (data) => {
        return cb(this._setError('BitPay service BitAuth create token: ERROR ', data));
      });
    });
  }

  private checkOtp(pairData: any, cb: Function) {
    if (pairData.otp) {
      let msg = 'Enter Two Factor for your BitPay account'; //TODO gettextcatalog
      this.popupProvider.ionicPrompt(null, msg, null).then((res) => {
        cb(res);
      });
    } else {
      cb();
    }
  }

  private fetchBasicInfo(apiContext: any, cb: Function) {
    let json = {
      method: 'getBasicInfo'
    };
    // Get basic account information
    this.bitPayProvider.post('/api/v2/' + apiContext.token, json, (data) => {
      if (data && data.error) return cb(data.error);
      this.logger.info('BitPay Account Get Basic Info: SUCCESS');
      return cb(null, data.data);
    }, (data) => {
      return cb(this._setError('BitPay Account Error: Get Basic Info', data));
    });
  };

  // Returns account objects as stored.
  public getAccountsAsStored(cb: Function) {
    this.persistenceProvider.getBitpayAccounts(this.bitPayProvider.getEnvironment().network).then((accounts) => {
      return cb(null, accounts);
    }).catch((err) => {
      return cb(err, []);
    });
  };

  // Returns an array where each element represents an account including all information required for fetching data
  // from the server for each account (apiContext).
  public getAccounts(cb: Function) {
    this.getAccountsAsStored((err, accounts) => {
      if (err || _.isEmpty(accounts)) {
        return cb(err, []);
      }
      this.appIdentityProvider.getIdentity(this.bitPayProvider.getEnvironment().network, (err, appIdentity) => {
        if (err) {
          return cb(err);
        }

        let accountsArray = [];
        _.forEach(Object.keys(accounts), (key) => {
          accounts[key].cards = accounts[key].cards;
          accounts[key].email = key;
          accounts[key].givenName = accounts[key].givenName || '';
          accounts[key].familyName = accounts[key].familyName || '';
          accounts[key].apiContext = {
            token: accounts[key].token,
            pairData: {
              email: key
            },
            appIdentity: appIdentity
          };

          accountsArray.push(accounts[key]);
        });
        return cb(null, accountsArray);
      });
    });
  };

  private setBitpayAccount(account: any) {
    this.persistenceProvider.setBitpayAccount(this.bitPayProvider.getEnvironment().network, account);
  };

  public removeAccount(account: any) {
    this.persistenceProvider.removeBitpayAccount(this.bitPayProvider.getEnvironment().network, account);
    this.bitPayCardProvider.register();
  };

  private _setError(msg: string, e: any): string {
    this.logger.error(msg);
    let error = (e && e.data && e.data.error) ? e.data.error : msg;
    return error;
  };

}
