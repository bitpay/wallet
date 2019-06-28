import { Injectable } from '@angular/core';

@Injectable()
export class AnalyticsProvider {
  logEvent(eventName: string, eventParams: { [key: string]: any }) {
    console.log(eventName, eventParams);
  }
}
