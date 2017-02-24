import { Injectable } from '@angular/core';
import { Logger } from 'angular2-logger/core';

@Injectable()
export class PlatformInfo {
  win: any = window;
  chrome: any = this.win.chrome;
  ua: any = this.win.navigator ? this.win.navigator.userAgent : null;

  isAndroid: boolean;
  isIOS: boolean;
  isWP: boolean;
  isSafari: boolean;
  isCordova: boolean;
  isNW: boolean;
  isMobile: boolean;
  isChromeApp: boolean;
  isDevel: boolean;
  hasClick: boolean = false;

  constructor(public logger: Logger) {
    if (!this.ua) {
      this.logger.debug('Could not determine navigator. Using fixed string');
      this.ua = 'dummy user-agent';
    }

    // Fixes IOS WebKit UA
    this.ua = this.ua.replace(/\(\d+\)$/, '');

    this.isAndroid = !!this.ua.match(/Android/i);
    this.isIOS = /iPad|iPhone|iPod/.test(this.ua) && !this.win.MSStream;
    this.isWP = !!this.ua.match(/IEMobile/i);
    this.isSafari = Object.prototype.toString.call(this.win.HTMLElement).indexOf('Constructor') > 0;
    this.isCordova = !!this.win.cordova;
    this.isNW = this.isNodeWebkit();

    this.isMobile = this.isAndroid || this.isIOS || this.isWP;
    this.isChromeApp = this.chrome.runtime && this.chrome.runtime.id && !this.isNW;
    this.isDevel = !this.isMobile && !this.isChromeApp && !this.isNW;

    if (this.win.sessionStorage.getItem('hasClick')) {
      this.hasClick = true;
    }
    this.win.addEventListener('mousedown', () => {
      this.hasClick = true;
      this.win.sessionStorage.setItem('hasClick', 'true');
    });
    this.win.addEventListener('touchstart', () => {
      this.hasClick = false;
      this.win.sessionStorage.removeItem('hasClick');
    });
  }

  isNodeWebkit() {
    return false;
  }

}
