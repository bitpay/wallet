import { Injectable } from '@angular/core';
import { FCMNG } from 'fcm-ng';
import { Observable } from 'rxjs';

@Injectable()
export class DynamicLinksProvider {
  constructor(private FCMPlugin: FCMNG) {}
  onDynamicLink(): Promise<any> {
    return this.FCMPlugin.onDynamicLink();
  }

  getDynamicLink(): Observable<any> {
    return this.FCMPlugin.getDynamicLink();
  }

  createDynamicLink(params: any): Promise<any> {
    return this.FCMPlugin.createDynamicLink(params);
  }
}
