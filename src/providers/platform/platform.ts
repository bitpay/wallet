import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';

import { Logger } from '../../providers/logger/logger';

@Injectable()
export class PlatformProvider {
  public isAndroid: boolean;
  public isIOS: boolean;
  public isSafari: boolean;
  public isCordova: boolean;
  public isNW: boolean;
  public ua: string;
  public isMobile: boolean;
  public isDevel: boolean;

  constructor(
    private platform: Platform,
    private logger: Logger
  ) {
    let ua: any = navigator ? navigator.userAgent : null;

    if (!ua) {
      this.logger.info('Could not determine navigator. Using fixed string');
      ua = 'dummy user-agent';
    }

    // Fixes IOS WebKit UA
    ua = ua.replace(/\(\d+\)$/, '');

    this.isAndroid = this.platform.is('android');
    this.isIOS = this.platform.is('ios');
    this.ua = ua;
    this.isCordova = this.platform.is('cordova');
    this.isNW = this.isNodeWebkit();
    this.isMobile = this.platform.is('mobile');
    this.isDevel = !this.isMobile && !this.isNW;

    this.logger.info('PlatformProvider initialized.');
  }

  public getBrowserName(): string {
    let userAgent = window.navigator.userAgent;
    let browsers = { chrome: /chrome/i, safari: /safari/i, firefox: /firefox/i, ie: /internet explorer/i };

    for (let key in browsers) {
      if (browsers[key].test(userAgent)) {
        return key;
      }
    };

    return 'unknown';
  }

  public isNodeWebkit(): boolean {
    let isNode = (typeof process !== "undefined" && typeof require !== "undefined");
    if (isNode) {
      try {
        return (typeof (window as any).require('nw.gui') !== "undefined");
      } catch (e) {
        return false;
      }
    }
  }
}
