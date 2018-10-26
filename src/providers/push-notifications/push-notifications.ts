import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FCM } from '@ionic-native/fcm';
import { Vibration } from '@ionic-native/vibration';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs';
import { Logger } from '../../providers/logger/logger';

// providers
import { AppProvider } from '../app/app';
import { BwcProvider } from '../bwc/bwc';
import { ConfigProvider } from '../config/config';
import { PlatformProvider } from '../platform/platform';
import { ProfileProvider } from '../profile/profile';

import * as _ from 'lodash';
import { ActionSheetProvider } from '../action-sheet/action-sheet';

@Injectable()
export class PushNotificationsProvider {
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
    private bwcProvider: BwcProvider,
    private FCMPlugin: FCM,
    private events: Events,
    private vibration: Vibration,
    private actionSheetProvider: ActionSheetProvider
  ) {
    this.logger.debug('PushNotificationsProvider initialized');
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
      this.FCMPlugin.getToken().then(token => {
        if (!token) {
          setTimeout(() => {
            this.init();
          }, 5000);
          return;
        }
        this.logger.debug('Get token for push notifications: ' + token);
        this._token = token;
        this.enable();
        this.handlePushNotifications();
      });
    });
  }

  public handlePushNotifications(): void {
    if (this.usePushNotifications) {
      this.FCMPlugin.onTokenRefresh().subscribe(token => {
        if (!this._token) return;
        this.logger.debug('Refresh and update token for push notifications...');
        this._token = token;
        this.enable();
      });

      this.FCMPlugin.onNotification().subscribe(async data => {
        if (!this._token) return;
        this.logger.debug(
          'New Event Push onNotification: ' + JSON.stringify(data)
        );
        if (data.wasTapped) {
          // Notification was received on device tray and tapped by the user.
          const walletIdHashed = data.walletId;
          if (!walletIdHashed) return;
          this._openWallet(walletIdHashed);
        } else {
          if (!this.configProvider.get().inAppNotificationsEnabled) return;
          if (data.body && data.title) {
            const walletName = this.profileProvider.getWallet(data.walletId)
              .name;
            const infoSheet = this.actionSheetProvider.createInfoSheet(
              'in-app-notification',
              {
                title: data.title,
                body: `${walletName}: ${data.body}`
              }
            );
            this.vibration.vibrate(300);
            infoSheet.present();
            await Observable.timer(5000).toPromise();
            infoSheet.dismiss();
          }
        }
      });
    }
  }

  public updateSubscription(walletClient): void {
    if (!this._token) {
      this.logger.warn(
        'Push notifications disabled for this device. Nothing to do here.'
      );
      return;
    }
    this._subscribe(walletClient);
  }

  public enable(): void {
    if (!this._token) {
      this.logger.warn(
        'No token available for this device. Cannot set push notifications. Needs registration.'
      );
      return;
    }

    const wallets = this.profileProvider.getWallets();
    _.forEach(wallets, walletClient => {
      this._subscribe(walletClient);
    });
  }

  public disable(): void {
    if (!this._token) {
      this.logger.warn(
        'No token available for this device. Cannot disable push notifications.'
      );
      return;
    }

    const wallets = this.profileProvider.getWallets();
    _.forEach(wallets, walletClient => {
      this._unsubscribe(walletClient);
    });
    this._token = null;
  }

  public unsubscribe(walletClient): void {
    if (!this._token) return;
    this._unsubscribe(walletClient);
  }

  private _subscribe(walletClient): void {
    const opts = {
      token: this._token,
      platform: this.isIOS ? 'ios' : this.isAndroid ? 'android' : null,
      packageName: this.appProvider.info.packageNameId
    };
    walletClient.pushNotificationsSubscribe(opts, err => {
      if (err)
        this.logger.error(
          walletClient.name + ': Subscription Push Notifications error. ',
          err.message
        );
      else
        this.logger.debug(
          walletClient.name + ': Subscription Push Notifications success.'
        );
    });
  }

  private _unsubscribe(walletClient): void {
    walletClient.pushNotificationsUnsubscribe(this._token, err => {
      if (err)
        this.logger.error(
          walletClient.name + ': Unsubscription Push Notifications error. ',
          err.message
        );
      else
        this.logger.debug(
          walletClient.name + ': Unsubscription Push Notifications Success.'
        );
    });
  }

  private async _openWallet(walletIdHashed) {
    let walletIdHash;
    const sjcl = this.bwcProvider.getSJCL();

    const wallets = this.profileProvider.getWallets();
    const wallet = _.find(wallets, w => {
      walletIdHash = sjcl.hash.sha256.hash(w.credentials.walletId);
      return _.isEqual(walletIdHashed, sjcl.codec.hex.fromBits(walletIdHash));
    });

    if (!wallet) return;

    await Observable.timer(1000).toPromise(); // wait for subscription to OpenWallet event

    this.events.publish('OpenWallet', wallet);
  }
}
