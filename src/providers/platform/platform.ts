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
  isChromeApp: boolean;
  isDevel: boolean;
  supportsLedger: boolean;
  supportsTrezor: boolean;
  versionIntelTEE: string;
  supportsIntelTEE: boolean;

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
    this.isChromeApp = this.getBrowserName() == 'chrome' && chrome && chrome.runtime && chrome.runtime.id && !this.isNW;
    this.isDevel = !this.isMobile && !this.isChromeApp && !this.isNW;
    this.supportsLedger = this.isChromeApp;
    this.supportsTrezor = this.isChromeApp || this.isDevel;
    this.versionIntelTEE = this.getVersionIntelTee();
    this.supportsIntelTEE = this.versionIntelTEE.length > 0;
  }

  getBrowserName(): string {
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

  getVersionIntelTee(): string {
    let v = '';
    let isWindows = navigator.platform.indexOf('Win') > -1;

    if (!this.isNodeWebkit() || !isWindows) {
      return v;
    }

    try {
      var IntelWallet = require('intelWalletCon');
      if (IntelWallet.getVersion) {
        v = IntelWallet.getVersion();
      } else {
        v = 'Alpha';
      }
      if (v.length > 0) {
        this.log.info('Intel TEE library ' + v);
      }
    } catch (e) { }
    return v;
  }
}
