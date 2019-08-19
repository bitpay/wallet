import { Injectable } from '@angular/core';
import { Firebase } from '@ionic-native/firebase';

@Injectable()
export class AnalyticsProvider {
  constructor(private FCMPlugin: Firebase) {}
  logEvent(eventName: string, eventParams: { [key: string]: any }) {
    this.FCMPlugin.logEvent(eventName, eventParams);
  }
}
