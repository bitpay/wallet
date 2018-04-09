import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FCM } from '@ionic-native/fcm';
import { App, NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// providers
import { AppProvider } from '../app/app';
import { BwcProvider } from '../bwc/bwc';
import { ConfigProvider } from '../config/config';
import { PlatformProvider } from '../platform/platform';
import { ProfileProvider } from '../profile/profile';

// pages
import { CopayersPage } from '../../pages/add/copayers/copayers';
import { WalletDetailsPage } from '../../pages/wallet-details/wallet-details';

import * as _ from 'lodash';

@Injectable()
export class PushNotificationsProvider {
  private navCtrl: NavController;
  private isIOS: boolean;
  private isAndroid: boolean;
  private usePushNotifications: boolean;
  private _token = null;

  constructor(
    public http: HttpClient,
    public profileProvider: ProfileProvider,
    public platformProvider: PlatformProvider,
    public configProvider: ConfigProvider,
    public logger: Logger,
    public appProvider: AppProvider,
    private app: App,
    private bwcProvider: BwcProvider,
    private FCMPlugin: FCM
  ) {
    this.logger.info('PushNotificationsProvider initialized.');
    this.isIOS = this.platformProvider.isIOS;
    this.isAndroid = this.platformProvider.isAndroid;
    this.usePushNotifications = this.platformProvider.isCordova;
  }

  public init(): void {
    if (!this.usePushNotifications || this._token) return;
    this.configProvider.load().then(() => {
      if (!this.configProvider.get().pushNotificationsEnabled) return;

      this.logger.debug('Starting push notification registration...');

      // Keep in mind the function will return null if the token has not been established yet.
      this.FCMPlugin.getToken().then((token: any) => {
        this.logger.debug('Get token for push notifications: ' + token);
        this._token = token;
        this.enable();
        this.handlePushNotifications();
      });
    });
  }

  public handlePushNotifications(): void {
    if (this.usePushNotifications) {

      this.FCMPlugin.onTokenRefresh().subscribe((token: any) => {
        if (!this._token) return;
        this.logger.debug('Refresh and update token for push notifications...');
        this._token = token;
        this.enable();
      });

      this.FCMPlugin.onNotification().subscribe((data: any) => {
        if (!this._token) return;
        this.logger.debug('New Event Push onNotification: ' + JSON.stringify(data));
        if (data.wasTapped) {
          // Notification was received on device tray and tapped by the user.
          var walletIdHashed = data.walletId;
          if (!walletIdHashed) return;
          this._openWallet(walletIdHashed);
        } else {
          // TODO
          // Notification was received in foreground. Maybe the user needs to be notified.
        }
      });
    }
  }

  public updateSubscription(walletClient: any): void {
    if (!this._token) {
      this.logger.warn('Push notifications disabled for this device. Nothing to do here.');
      return;
    }
    this._subscribe(walletClient);
  }

  public enable(): void {
    if (!this._token) {
      this.logger.warn('No token available for this device. Cannot set push notifications. Needs registration.');
      return;
    }

    var wallets = this.profileProvider.getWallets();
    _.forEach(wallets, (walletClient: any) => {
      this._subscribe(walletClient);
    });
  };

  public disable(): void {
    if (!this._token) {
      this.logger.warn('No token available for this device. Cannot disable push notifications.');
      return;
    }

    var wallets = this.profileProvider.getWallets();
    _.forEach(wallets, (walletClient: any) => {
      this._unsubscribe(walletClient);
    });
    this._token = null;
  }

  public unsubscribe(walletClient: any): void {
    if (!this._token) return;
    this._unsubscribe(walletClient);
  }

  private _subscribe(walletClient: any): void {
    let opts = {
      token: this._token,
      platform: this.isIOS ? 'ios' : this.isAndroid ? 'android' : null,
      packageName: this.appProvider.info.packageNameId
    };
    walletClient.pushNotificationsSubscribe(opts, (err: any) => {
      if (err) this.logger.error(walletClient.name + ': Subscription Push Notifications error. ', JSON.stringify(err));
      else this.logger.debug(walletClient.name + ': Subscription Push Notifications success.');
    });
  }

  private _unsubscribe(walletClient: any): void {
    walletClient.pushNotificationsUnsubscribe(this._token, (err: any) => {
      if (err) this.logger.error(walletClient.name + ': Unsubscription Push Notifications error. ', JSON.stringify(err));
      else this.logger.debug(walletClient.name + ': Unsubscription Push Notifications Success.');
    });
  }

  private _openWallet(walletIdHashed: any): void {
    let walletIdHash;
    let sjcl = this.bwcProvider.getSJCL();

    let wallets = this.profileProvider.getWallets();
    let wallet: any = _.find(wallets, (w: any) => {
      walletIdHash = sjcl.hash.sha256.hash(w.credentials.walletId);
      return _.isEqual(walletIdHashed, sjcl.codec.hex.fromBits(walletIdHash));
    });

    if (!wallet) return;

    this.navCtrl = this.app.getActiveNav();
    this.navCtrl.popToRoot({ animate: false }).then(() => {
      this.navCtrl.parent.select(0);
      if (!wallet.isComplete()) {
        this.navCtrl.push(CopayersPage, { walletId: wallet.credentials.walletId });
        return;
      }
      this.navCtrl.push(WalletDetailsPage, { walletId: wallet.credentials.walletId });
    });
  }
}
