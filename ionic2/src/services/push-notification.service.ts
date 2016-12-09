import { Injectable } from '@angular/core';
import { Push } from 'ionic-native';
import { Logger } from 'angular2-logger/core';
import lodash from 'lodash';

import { ConfigService } from './config.service';
import { PlatformInfo } from './platform-info.service';

Injectable()
export class PushNotificationService {

  isCordova: boolean = false;
  isWP: boolean = false;
  isIOS: boolean = false;
  isAndroid: boolean = false;

  usePushNotifications: boolean = false;

  token: any;

  constructor(
    public configService: ConfigService,
    public logger: Logger,
    public platformInfo: PlatformInfo
  ) {
    this.isCordova = platformInfo.isCordova;
    this.isWP = platformInfo.isWP;
    this.isIOS = platformInfo.isIOS;
    this.isAndroid = platformInfo.isAndroid;
    this.usePushNotifications = this.isCordova && !this.isWP;
  }

  init(walletsClients) {
    let defaults = this.configService.getDefaults();
    let push;
    try {
      push = Push.init(defaults.pushNotifications.config);
    } catch(e) {
      this.logger.error(e);
      return;
    };

    push.on('registration', (data) => {
      this.logger.debug('Starting push notification registration');
      this.token = data.registrationId;
      let config = this.configService.getSync();
      if (config.pushNotifications.enabled) this.enableNotifications(walletsClients);
    });

    return push;
  }

  enableNotifications(walletsClients) {
    if (!this.usePushNotifications) return;

    let config = this.configService.getSync();
    if (!config.pushNotifications.enabled) return;

    if (!this.token) {
      this.logger.warn('No token available for this device. Cannot set push notifications. Needs registration.');
      return;
    }

    lodash.forEach(walletsClients, (walletClient) => {
      let opts: any = {};
      opts.type = this.isIOS ? "ios" : this.isAndroid ? "android" : null;
      opts.token = this.token;
      this.subscribe(opts, walletClient, (err, response) => {
        if (err) this.logger.warn('Subscription error: ' + err.message + ': ' + JSON.stringify(opts));
        else this.logger.debug('Subscribed to push notifications service: ' + JSON.stringify(response));
      });
    });
  }

  disableNotifications(walletsClients) {
    if (!this.usePushNotifications) return;

    lodash.forEach(walletsClients, (walletClient) => {
      this.unsubscribe(walletClient, (err) => {
        if (err) this.logger.warn('Unsubscription error: ' + err.message);
        else this.logger.debug('Unsubscribed from push notifications service');
      });
    });
  }

  subscribe(opts, walletClient, cb) {
    if (!this.usePushNotifications) return cb();

    let config = this.configService.getSync();
    if (!config.pushNotifications.enabled) return;

    walletClient.pushNotificationsSubscribe(opts, (err, resp) => {
      if (err) return cb(err);
      return cb(null, resp);
    });
  }

  unsubscribe(walletClient, cb) {
    if (!this.usePushNotifications) return cb();

    walletClient.pushNotificationsUnsubscribe((err) => {
      if (err) return cb(err);
      return cb(null);
    });
  }

}
