import { Injectable } from '@angular/core';
import { FCMNG } from 'fcm-ng';
import { Events } from 'ionic-angular';

import { IncomingDataProvider } from '../incoming-data/incoming-data';
import { Logger } from '../logger/logger';
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';
import { PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';

const LOCK_TIMEOUT = 500;

@Injectable()
export class DynamicLinksProvider {
  private locked: boolean;
  constructor(
    private logger: Logger,
    private events: Events,
    private FCMPlugin: FCMNG,
    private incomingDataProvider: IncomingDataProvider,
    private platformProvider: PlatformProvider,
    private persistenceProvider: PersistenceProvider,
    private onGoingProcessProvider: OnGoingProcessProvider
  ) {
    this.logger.debug('DynamicLinksProvider initialized');
  }

  async init() {
    let dynLink;
    dynLink = this.platformProvider.isIOS
      ? await this.onDynamicLink()
      : await this.getDynamicLink();
    this.logger.debug('Firebase Dynamic Link Data: ', JSON.stringify(dynLink));

    if (typeof dynLink === 'string') {
      this.logger.debug('Universal Link');

      // defer flag is coming from FCM - marks only "last" links
      const isDeferred = dynLink.includes('defer');
      const timeout = isDeferred ? 2000 : 0;

      if (isDeferred) {
        this.onGoingProcessProvider.set('generalAwaiting');
        dynLink = dynLink.split('?defer')[0];
      }

      const subscription = this.platformProvider.platformReady$.subscribe(
        (ready: boolean) => {
          if (ready && !this.locked) {
            this.locked = true;
            setTimeout(() => {
              this.onGoingProcessProvider.clear();
              this.incomingDataProvider.redir(decodeURIComponent(dynLink), {
                force: true
              });
            }, timeout);
            setTimeout(() => (this.locked = false), LOCK_TIMEOUT);
            subscription && subscription.unsubscribe();
          }
        }
      );
      return;
    }

    this.onGoingProcessProvider.clear();
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
    const view =
      this.incomingDataProvider.getParameterByName('view', deepLink) ||
      'DynamicLink';
    const stateParams = { deepLink: true };
    const nextView = {
      name: view,
      params: stateParams
    };
    this.events.publish('IncomingDataRedir', nextView);
  }
}
