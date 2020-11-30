import { Injectable } from '@angular/core';
import { FCMNG } from 'fcm-ng';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs';

import { IncomingDataProvider } from '../incoming-data/incoming-data';
import { Logger } from '../logger/logger';

@Injectable()
export class DynamicLinksProvider {
  constructor(
    private logger: Logger,
    private events: Events,
    private FCMPlugin: FCMNG,
    private incomingDataProvider: IncomingDataProvider
  ) {
    this.logger.debug('DynamicLinksProvider initialized');
  }
  onDynamicLink() {
    this.FCMPlugin.onDynamicLink().then(data => {
      this.logger.debug('Firebase Dynamic Link Data: ', JSON.stringify(data));
      if (data && data.deepLink) this.processDeepLink(data.deepLink);
    });
  }

  getDynamicLink(): Observable<any> {
    return this.FCMPlugin.getDynamicLink();
  }

  createDynamicLink(params: any): Promise<any> {
    return this.FCMPlugin.createDynamicLink(params);
  }

  processDeepLink(deepLink: string) {
    const view = this.incomingDataProvider.getParameterByName('view', deepLink);
    const stateParams = { deepLink: true };
    const nextView = {
      name: view,
      params: stateParams
    };
    this.events.publish('IncomingDataRedir', nextView);
  }
}
