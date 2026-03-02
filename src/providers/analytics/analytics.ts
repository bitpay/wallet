import { Injectable } from '@angular/core';
import { FCMNG } from 'fcm-ng';
import { PlatformProvider } from '../platform/platform';

declare var cordova: any;

@Injectable()
export class AnalyticsProvider {
  constructor(
    private FCMPlugin: FCMNG,
    private platformProvider: PlatformProvider
  ) {}
  logEvent(eventName: string, eventParams: { [key: string]: any }) {
    if (this.platformProvider.isCordova)
      this.FCMPlugin.logEvent(eventName, eventParams);
  }

  setUserProperty(name: string, value: string) {
    if (this.platformProvider.isCordova)
      this.FCMPlugin.setUserProperty(name, value);
  }

  setTrackingPermissions(): Promise<string> {
    const idfaPlugin = cordova.plugins.idfa;
    return new Promise((resolve, reject) => {
      idfaPlugin
        .getInfo()
        .then(info => {
          if (info && !info.trackingLimited) {
            return resolve(JSON.stringify(info));
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
                idfaPlugin.getInfo().then(info => {
                  return resolve(JSON.stringify(info));
                });
              } else if (
                result &&
                result == idfaPlugin.TRACKING_PERMISSION_DENIED
              ) {
                return reject('Permission Denied');
              } else {
                return reject(result);
              }
            });
          } else if (
            info &&
            info.trackingPermission === idfaPlugin.TRACKING_PERMISSION_DENIED
          ) {
            return reject('Permission Denied');
          } else if (
            info &&
            info.trackingPermission ===
              idfaPlugin.TRACKING_PERMISSION_AUTHORIZED
          ) {
            return resolve(JSON.stringify(info));
          } else {
            return reject('Could not get AppTrackingTransparency');
          }
        })
        .then(idfaOrAaid => {
          if (idfaOrAaid) {
            return resolve(idfaOrAaid);
          }
        })
        .catch(_ => {
          return reject('Device is not supported');
        });
    });
  }
}
