import { Injectable } from '@angular/core';
import { FCMNG } from 'fcm-ng';
import { PlatformProvider } from '../platform/platform';

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
}
