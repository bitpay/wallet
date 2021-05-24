import { Injectable } from '@angular/core';
import { FCMNG } from 'fcm-ng';
import { PlatformProvider } from '../platform/platform';

declare var cordova: any;

@Injectable()
export class AnalyticsProvider {
  private hasPermission: boolean = false;
  constructor(
    private FCMPlugin: FCMNG,
    private platformProvider: PlatformProvider
  ) {}
  logEvent(eventName: string, eventParams: { [key: string]: any }) {
    this.getPermissions().then(res => {
      if (res) this.FCMPlugin.logEvent(eventName, eventParams);
    });
  }

  setUserProperty(name: string, value: string) {
    this.getPermissions().then(res => {
      if (res) this.FCMPlugin.setUserProperty(name, value);
    });
  }

  getPermissions(): Promise<boolean> {
    return new Promise(resolve => {
      if (!this.platformProvider.isCordova) return resolve(true);
      if (!this.platformProvider.isIOS) return resolve(true);
      if (this.hasPermission) return resolve(true);
      return resolve(false);
    });
  }

  setTrackingPermissions(): Promise<string> {
    const idfaPlugin = cordova.plugins.idfa;
    return new Promise((resolve, reject) => {
      idfaPlugin
        .getInfo()
        .then(info => {
          if (info && !info.trackingLimited) {
            this.hasPermission = true;
            return resolve(info.idfa || info.aaid);
          } else if (
            info &&
            info.trackingPermission ===
              idfaPlugin.TRACKING_PERMISSION_NOT_DETERMINED
          ) {
            // Request permission
            idfaPlugin.requestPermission().then(result => {
              if (
                result &&
                result === idfaPlugin.TRACKING_PERMISSION_AUTHORIZED
              ) {
                this.hasPermission = true;
                idfaPlugin.getInfo().then(info => {
                  return resolve(info.idfa || info.aaid);
                });
              } else if (
                result &&
                result == idfaPlugin.TRACKING_PERMISSION_DENIED
              ) {
                this.hasPermission = false;
                return reject('Tracking Permission Denied');
              } else {
                this.hasPermission = false;
                return reject(result);
              }
            });
          } else if (
            info &&
            info.trackingPermission === idfaPlugin.TRACKING_PERMISSION_DENIED
          ) {
            this.hasPermission = false;
            return reject('Tracking Permission Denied');
          } else if (
            info &&
            info.trackingPermission ===
              idfaPlugin.TRACKING_PERMISSION_AUTHORIZED
          ) {
            this.hasPermission = true;
            return resolve(info.idfa || info.aaid);
          } else {
            this.hasPermission = false;
            return reject('Could not get Tracking information');
          }
        })
        .catch(_ => {
          this.hasPermission = false;
          return reject('Device is supported');
        });
    });
  }
}
