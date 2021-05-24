import { Injectable } from '@angular/core';
import { FCMNG } from 'fcm-ng';
import { PlatformProvider } from '../platform/platform';

declare var cordova: any;

@Injectable()
export class AnalyticsProvider {
  private hasPermission: boolean;
  constructor(
    private FCMPlugin: FCMNG,
    private platformProvider: PlatformProvider
  ) {
    const idfa = this.getIdfa();
    console.log('[analytics.ts:14]', idfa); /* TODO */
  }
  logEvent(eventName: string, eventParams: { [key: string]: any }) {
    if (this.getPermissions()) this.FCMPlugin.logEvent(eventName, eventParams);
  }

  setUserProperty(name: string, value: string) {
    if (this.getPermissions()) this.FCMPlugin.setUserProperty(name, value);
  }

  getPermissions() {
    return this.platformProvider.isCordova && this.hasPermission;
  }

  getIdfa() {
    if (!this.platformProvider.isCordova && !this.platformProvider.isIOS) {
      this.hasPermission = true;
      return;
    }
    const idfaPlugin = cordova.plugins.idfa;

    idfaPlugin
      .getInfo()
      .then(info => {
        if (!info.trackingLimited) {
          return info.idfa || info.aaid;
        } else if (
          info.trackingPermission ===
          idfaPlugin.TRACKING_PERMISSION_NOT_DETERMINED
        ) {
          return idfaPlugin.requestPermission().then(result => {
            if (result === idfaPlugin.TRACKING_PERMISSION_AUTHORIZED) {
              this.hasPermission = true;
              return idfaPlugin.getInfo().then(info => {
                return info.idfa || info.aaid;
              });
            }
          });
        } else {
          this.hasPermission = false;
        }
      })
      .then(idfaOrAaid => {
        if (idfaOrAaid) {
          console.log(idfaOrAaid);
        }
      });
  }
}
