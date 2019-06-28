import { Injectable } from '@angular/core';

@Injectable()
export class AnalyticsProvider {
  trackEvent(eventName: string, eventParams: { [key: string]: any }) {
    console.log(eventName, eventParams);
  }
}
