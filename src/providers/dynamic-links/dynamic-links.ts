import { Injectable } from '@angular/core';
import { FCMNG } from 'fcm-ng';
import { Events } from 'ionic-angular';

import { IncomingDataProvider } from '../incoming-data/incoming-data';
import { Logger } from '../logger/logger';
import { PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';

@Injectable()
export class DynamicLinksProvider {
  constructor(
    private logger: Logger,
    private events: Events,
    private FCMPlugin: FCMNG,
    private incomingDataProvider: IncomingDataProvider,
    private platformProvider: PlatformProvider,
    private persistenceProvider: PersistenceProvider
  ) {
    this.logger.debug('DynamicLinksProvider initialized');
  }

  async init() {
    let dynLink;
    dynLink = this.platformProvider.isIOS
      ? await this.onDynamicLink()
      : await this.getDynamicLink();
    this.logger.debug('Firebase Dynamic Link Data: ', JSON.stringify(dynLink));
    if (dynLink && dynLink.deepLink) this.processDeepLink(dynLink.deepLink);
  }

  private getDynamicLink(): Promise<any> {
    return new Promise(resolve => {
      this.FCMPlugin.getDynamicLink().subscribe(data => {
        if (data && data.deepLink && data.newInstall)
          this.persistenceProvider.setDynamicLink(data.deepLink);
        resolve(data);
      });
    });
  }

  private onDynamicLink(): Promise<any> {
    return this.FCMPlugin.onDynamicLink();
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
