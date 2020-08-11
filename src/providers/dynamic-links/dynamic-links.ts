import { Injectable } from '@angular/core';
import { FCMNG } from 'fcm-ng';
import { PlatformProvider } from '../platform/platform';

@Injectable()
export class DynamicLinksProvider {
  constructor(
    private FCMPlugin: FCMNG,
    private platformProvider: PlatformProvider
  ) {}
  onDynamicLink() {
    if (this.platformProvider.isCordova) this.FCMPlugin.onDynamicLink();
  }

  createDynamicLink(params: any) {
    if (this.platformProvider.isCordova)
      this.FCMPlugin.createDynamicLink(params);
  }
}
