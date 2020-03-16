import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// providers
import { Events } from 'ionic-angular';
import 'rxjs/add/observable/fromEvent';
import { Observable } from 'rxjs/Observable';
import { ElectronProvider } from '../electron/electron';
import { PlatformProvider } from '../platform/platform';
import { PopupProvider } from '../popup/popup';

@Injectable()
export class ExternalLinkProvider {
  constructor(
    private popupProvider: PopupProvider,
    private logger: Logger,
    private platformProvider: PlatformProvider,
    private electronProvider: ElectronProvider,
    private events: Events
  ) {
    this.logger.debug('ExternalLinkProvider initialized');
  }

  private restoreHandleOpenURL(old: string): void {
    setTimeout(() => {
      (window as any).handleOpenURL = old;
    }, 500);
  }

  public open(
    url: string,
    optIn?: boolean,
    title?: string,
    message?: string,
    okText?: string,
    cancelText?: string
  ) {
    return new Promise(resolve => {
      if (optIn) {
        this.popupProvider
          .ionicConfirm(title, message, okText, cancelText)
          .then((res: boolean) => {
            this.openBrowser(res, url);
            resolve();
          });
      } else {
        this.openBrowser(true, url);
        resolve();
      }
    });
  }

  private openBrowser(res: boolean, url: string) {
    let old = (window as any).handleOpenURL;

    // Ignore external URLs: avoid opening action sheet
    (window as any).handleOpenURL = url => {
      this.logger.debug('Skip: ' + url);
    };

    if (res) {
      if (this.platformProvider.isElectron) {
        this.electronProvider.openExternalLink(url);
      } else {
        // workaround for an existing cordova inappbrowser plugin issue - redirecting events back to the iab ref
        const w = window.open(url, '_system');
        Observable.fromEvent(w, 'message').subscribe(e =>
          this.events.publish('iab_message_update', e)
        );
      }
    }

    this.restoreHandleOpenURL(old);
  }
}
