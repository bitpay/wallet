import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { timer } from 'rxjs';
import { FCM } from "@capacitor-community/fcm";

// providers
import { AppProvider } from '../app/app';
import { BwcProvider } from '../bwc/bwc';
import { ConfigProvider } from '../config/config';
import { PlatformProvider } from '../platform/platform';
import { ProfileProvider } from '../profile/profile';

import BWC from '@abcpros/bitcore-wallet-client';
import * as _ from 'lodash';
import { Logger } from '../logger/logger';
import { AnimationController, ModalController } from '@ionic/angular';
import { EventManagerService } from '../event-manager.service';
import { NotificationComponent } from 'src/app/components/notification-component/notification-component';

import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications
} from '@capacitor/push-notifications';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsProvider {
  private isIOS: boolean;
  private isAndroid: boolean;
  private usePushNotifications: boolean;
  private _token = null;
  private fcmInterval;
  private notifications = [];
  private currentNotif: HTMLIonModalElement;
  private openWalletId;
  constructor(
    public http: HttpClient,
    public profileProvider: ProfileProvider,
    public platformProvider: PlatformProvider,
    public configProvider: ConfigProvider,
    public logger: Logger,
    public appProvider: AppProvider,
    private bwcProvider: BwcProvider,
    private events: EventManagerService,
    private modalCtrl: ModalController,
    private translate: TranslateService,
    public animationCtrl: AnimationController
  ) {
    this.logger.debug('PushNotificationsProvider initialized');
    this.isIOS = this.platformProvider.isIOS;
    this.isAndroid = this.platformProvider.isAndroid;
    this.usePushNotifications = this.platformProvider.isCordova;
  }

  public init(): void {
    if (!this.usePushNotifications || this._token) return;
    this.configProvider.load().then(async () => {
      const config = this.configProvider.get();
      if (!config.pushNotifications.enabled) return;
      await this.registerNotifications();
      // On success, we should be able to receive notifications
      await this.getToken();
      this.enable();
      // enabling topics
      if (
        this.appProvider.info.name != 'copay' &&
        config.offersAndPromotions.enabled
      )
          await this.subscribeToTopic('offersandpromotions');
      if (
        this.appProvider.info.name != 'copay' &&
        config.productsUpdates.enabled
      )
          await this.subscribeToTopic('productsupdates');

      this.fcmInterval = setInterval(() => {
        this.renewSubscription();
      }, 5 * 60 * 1000); // 5 min
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        return this.handlePushNotifications(notification);
      }
    );

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed',
      async (notification: ActionPerformed) => {
        return await this.handlePushNotificationsWasTapped(notification);
      });
  }

  private async getToken() {
    if (this.platformProvider.isAndroid) {
      PushNotifications.addListener('registration', async ({ value }) => {
        if (!value) {
          setTimeout(() => {
            this.init();
          }, 5000);
          return;
        }
          this.logger.debug('Get token for push notifications android: ' + value);
          this._token = value;
      })
    } else {
      FCM.getToken()
      .then(async token => {
        if (!token) {
          setTimeout(() => {
            this.init();
          }, 5000);
          return;
        }
          this.logger.debug('Get token for push notifications ios: ' + token.token);
          this._token = token.token;
      }).catch(error=>{
        this.logger.error(error);
      });
    }
  }

  private async registerNotifications() {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      throw new Error('User denied permissions!');
    }

    await PushNotifications.register();
  }

  private renewSubscription(): void {
    const opts = {
      showHidden: false
    };
    const wallets = this.profileProvider.getWallets(opts);
    _.forEach(wallets, walletClient => {
      this._unsubscribe(walletClient);
    });
    setTimeout(() => {
      this.updateSubscription(wallets);
    }, 1000);
  }

  // Notification was received on device tray and tapped by the user.
  public handlePushNotificationsWasTapped(notification: ActionPerformed): void {
    if (this.usePushNotifications) {
        if (!this._token) return;
      const data = _.get(notification, 'notification.data', undefined);
      if (!data) return;
          if (data.redir) {
            this.events.publish('IncomingDataRedir', { name: data.redir });
          } else if (
            data.takeover_url &&
            data.takeover_image &&
            data.takeover_sig
          ) {
            if (!this.verifySignature(data)) return;
            this.events.publish('ShowAdvertising', data);
          } else {
            this._openWallet(data);
          }
    }
  }

  public handlePushNotifications(notification: PushNotificationSchema): void {
    if (this.usePushNotifications) {
      if (!this._token) return;
      const data = notification.data
      this.logger.debug(
        'New Event Push onNotification: ' + JSON.stringify(data)
      );
          const wallet = this.findWallet(data.walletId, data.tokenAddress);
          if (!wallet) return;
          this.newBwsEvent(data, wallet.credentials.walletId);
          this.showInappNotification(data);
        }
  }

  public newBwsEvent(notification, walletId): void {
    let id = walletId;
    if (notification.tokenAddress) {
      id = walletId + '-' + notification.tokenAddress.toLowerCase();
      this.logger.debug(`event for token wallet: ${id}`);
    }
    this.events.publish(
      'bwsEvent',
      id,
      notification.notification_type,
      notification
    );
  }

  public updateSubscription(walletClient): void {
    if (!this._token) {
      this.logger.warn(
        'Push notifications disabled for this device. Nothing to do here.'
      );
      return;
    }
    if (!_.isArray(walletClient)) walletClient = [walletClient];
    walletClient.forEach(w => {
      this._subscribe(w);
    });
  }

  public enable(): void {
    if (!this._token) {
      this.logger.warn(
        'No token available for this device. Cannot set push notifications. Needs registration.'
      );
      return;
    }

    const opts = {
      showHidden: false
    };
    const wallets = this.profileProvider.getWallets(opts);
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

    // disabling topics
    this.unsubscribeFromTopic('offersandpromotions');
    this.unsubscribeFromTopic('productsupdates');

    const opts = {
      showHidden: true
    };
    const wallets = this.profileProvider.getWallets(opts);
    _.forEach(wallets, walletClient => {
      this._unsubscribe(walletClient);
    });
    this._token = null;

    clearInterval(this.fcmInterval);
  }

  public unsubscribe(walletClient): void {
    if (!this._token) return;
    this._unsubscribe(walletClient);
  }

  public async subscribeToTopic(topic: string): Promise<void> {
    await FCM.subscribeTo({ topic: topic })
      .then(r => {
        return this.logger.info(r);
      })
      .catch(err => {
        return this.logger.error(err);
      });
  }

  public async unsubscribeFromTopic(topic: string): Promise<void> {
    await FCM.unsubscribeFrom({ topic: topic })
      .then(r => {
        return this.logger.info(r);
      })
      .catch(err => {
        return this.logger.error(err);
      });
  }

  private _subscribe(walletClient): void {
    const opts = {
      token: this._token,
      platform: this.isIOS ? 'ios' : this.isAndroid ? 'android' : null,
      packageName: this.appProvider.info.packageNameId,
      walletId: walletClient.credentials.walletId
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

  private async _openWallet(data) {
    const walletIdHashed = data.walletId;
    const tokenAddress = data.tokenAddress;
    const multisigContractAddress = data.multisigContractAddress;
    if (!walletIdHashed) return;

    const wallet = this.findWallet(
      walletIdHashed,
      tokenAddress,
      multisigContractAddress
    );

    if (!wallet || this.openWalletId === wallet.credentials.walletId) return;

    this.openWalletId = wallet.credentials.walletId; // avoid opening the same wallet many times

    await timer(1000).toPromise(); // wait for subscription to OpenWallet event

    this.events.publish('OpenWallet', wallet);
  }

  private findWallet(walletIdHashed, tokenAddress, multisigContractAddress?) {
    let walletIdHash;
    const sjcl = this.bwcProvider.getSJCL();

    const wallets = this.profileProvider.getWallets();
    const wallet = _.find(wallets, w => {
      if (tokenAddress || multisigContractAddress) {
        const walletId = w.credentials.walletId;
        const lastHyphenPosition = walletId.lastIndexOf('-');
        const walletIdWithoutTokenAddress = walletId.substring(
          0,
          lastHyphenPosition
        );
        walletIdHash = sjcl.hash.sha256.hash(walletIdWithoutTokenAddress);
      } else {
        walletIdHash = sjcl.hash.sha256.hash(w.credentials.walletId);
      }
      return _.isEqual(walletIdHashed, sjcl.codec.hex.fromBits(walletIdHash));
    });

    return wallet;
  }

  public async clearAllNotifications(): Promise<void> {
    if (!this._token) return;
    await PushNotifications.removeAllDeliveredNotifications();
  }

  private verifySignature(data): boolean {
    const pubKey = this.appProvider.info.marketingPublicKey;
    if (!pubKey) return false;

    const b = BWC.Bitcore;
    const ECDSA = b.crypto.ECDSA;
    const Hash = b.crypto.Hash;
    const SEP = '::';
    const _takeover_url = data.takeover_url;
    const _takeover_image = data.takeover_image;
    const _takeover_sig = data.takeover_sig;

    const sigObj = b.crypto.Signature.fromString(_takeover_sig);
    const _hashbuf = Hash.sha256(
      Buffer.from(_takeover_url + SEP + _takeover_image)
    );
    const verificationResult = ECDSA.verify(
      _hashbuf,
      sigObj,
      new b.PublicKey(pubKey),
      'little'
    );
    return verificationResult;
  }

  public showInappNotification(data) {
    if (!data.body || data.notification_type === 'NewOutgoingTx') return;

    this.notifications.unshift(data);
    this.runNotificationsQueue();
  }

  private runNotificationsQueue() {
    if (this.currentNotif) return;
    this.notifications.some(async data => {
      if (!data.showDone) {
        this.currentNotif = await this.modalCtrl.create({
          component: NotificationComponent,
          componentProps: {
            title: data.title,
            message: data.body,
            customButton: {
              closeButtonText: this.translate.instant('Open Account'),
              data: {
                action: 'openWallet',
                walletId: data.walletId
              }
            }
          },
          showBackdrop: true,
          backdropDismiss: true,
          cssClass: 'in-app-notification-modal'
        });
        this.currentNotif.onDidDismiss().then(({ data }) => {
          if (data && data.action && data.action === 'openWallet')  {
            this._openWallet(data);
          }
          this.currentNotif = null;
          this.runNotificationsQueue();
        })

        await this.currentNotif.present();
        data.showDone = true;
        return true;
      }
      return false;
    });
  }
}
