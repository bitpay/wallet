import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

@Injectable()
export class PlatformProvider {
  isAndroid: boolean;
  isIOS: boolean;
  isWP: boolean;
  isSafari: boolean;
  isCordova: boolean;
  isNW: boolean;
  ua: string;
  isMobile: boolean;
  isDevel: boolean;

  constructor(private platform: Platform, private log: Logger) {
    var ua = navigator ? navigator.userAgent : null;

    if (!ua) {
      console.log('Could not determine navigator. Using fixed string');
      ua = 'dummy user-agent';
    }

    // Fixes IOS WebKit UA
    ua = ua.replace(/\(\d+\)$/, '');

    this.isAndroid = platform.is('android');
    this.isIOS = platform.is('ios');
    this.isWP = platform.is('windows') && platform.is('mobile');
    this.ua = ua;
    this.isCordova = platform.is('cordova');
    this.isNW = this.isNodeWebkit();
    this.isMobile = platform.is('mobile');
    this.isDevel = !this.isMobile && !this.isNW;

    this.log.info('PlatformProvider initialized.');
  }

  getBrowserName(): string {
    let chrome: any;
    let userAgent = window.navigator.userAgent;
    let browsers = { chrome: /chrome/i, safari: /safari/i, firefox: /firefox/i, ie: /internet explorer/i };

    for (let key in browsers) {
      if (browsers[key].test(userAgent)) {
        return key;
      }
    };

    return 'unknown';
  }

  isNodeWebkit(): boolean {
    let isNode = (typeof process !== "undefined" && typeof require !== "undefined");
    if (isNode) {
      try {
        return (typeof require('nw.gui') !== "undefined");
      } catch (e) {
        return false;
      }
    }
  }
}
