import { Injectable } from '@angular/core';
import { FCMNG } from 'fcm-ng';

@Injectable()
export class DynamicLinksProvider {
  constructor(private FCMPlugin: FCMNG) {}
  onDynamicLink(): Promise<any> {
    return this.FCMPlugin.onDynamicLink();
  }

  createDynamicLink(params: any): Promise<any> {
    return this.FCMPlugin.createDynamicLink(params);
  }
}
