import { Injectable } from '@angular/core';
import { FCMNG } from 'fcm-ng';

@Injectable()
export class AnalyticsProvider {
  constructor(private FCMPlugin: FCMNG) {}
  logEvent(eventName: string, eventParams: { [key: string]: any }) {
    this.FCMPlugin.logEvent(eventName, eventParams);
  }
}
