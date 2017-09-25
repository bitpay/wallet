import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';

import { PlatformProvider } from '../platform/platform';
import { ConfigProvider } from '../config/config';
import { BwcProvider } from '../bwc/bwc';

// TODO: create interface
interface Wallet {
  baseUrl: string;
  credentials: Object;
  doNotVerifyPayPro: boolean;
  logLevel: string;
  payProHttp: string;
  request: Function;
  supportStaffWalletId: string;
  timeout: Number;
}

class Wallet implements Wallet {
  constructor(
    public baseUrl: string = '1.0.0',
  ) {
    // Nothing to do
  }

}

const UPDATE_PERIOD = 15;

@Injectable()
export class WalletProvider {
  public wallet: Object = new Object();

  constructor(
    private logger: Logger,
    private platform: PlatformProvider,
    private config: ConfigProvider,
    private bwc: BwcProvider
  ) {
    console.log('Hello WalletService Provider');
  }

  bind(credential) {
    let defaults = this.config.get();

    let wallet = this.bwc.getClient(JSON.stringify(credential), {
      bwsurl: defaults['bws']['url'],
    });
    this.bindClient(wallet);
    return wallet;
  }

  bindClient(wallet, opts?) {
    opts = opts || {};
    let walletId = wallet.credentials.walletId;

    //root.updateWalletSettings(wallet);
    this.wallet[walletId] = wallet;

    /*
      _needsBackup(wallet, function(val) {
        wallet.needsBackup = val;
      });

      _balanceIsHidden(wallet, function(val) {
        wallet.balanceHidden = val;
      });
    */

    this.wallet[walletId].openWallet((err, ret) => {
      if (this.wallet[walletId].status !== true)
        this.logger.info('Wallet + ' + walletId + ' status: ' + this.wallet[walletId].status);
    });



    /*
    this.wallet[walletId].initialize({
      notificationIncludeOwn: true,
    }, function(err) {
      if (err) {
        console.log('Could not init notifications err:', err);
        return;
      }
      this.wallet[walletId].setNotificationsInterval(UPDATE_PERIOD);
      this.wallet[walletId].openWallet(function(err) {
        if (wallet.status !== true)
          console.log('Wallet + ' + walletId + ' status:' + wallet.status)
      });
    });
     */
  }

}
