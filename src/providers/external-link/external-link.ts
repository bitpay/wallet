import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { PopupProvider } from '../popup/popup';
import { PlatformProvider } from '../platform/platform';
import { NodeWebkitProvider } from '../node-webkit/node-webkit';

@Injectable()
export class ExternalLinkProvider {

  constructor(
    private popupProvider: PopupProvider,
    private logger: Logger,
    private platformProvider: PlatformProvider,
    private nodeWebkitProvider: NodeWebkitProvider
  ) {
    this.logger.info('ExternalLinkProvider initialized.');
  }


  private restoreHandleOpenURL(old: string): void {
    setTimeout(() => {
      (window as any).handleOpenURL = old;
    }, 500);
  }

  public open(url: string, optIn?: boolean, title?: string, message?: string, okText?: string, cancelText?: string) {
    let old = (window as any).handleOpenURL;

    (window as any).handleOpenURL = (url) => {
      // Ignore external URLs
      this.logger.debug('Skip: ' + url);
    };

    if (this.platformProvider.isNW) {
      this.nodeWebkitProvider.openExternalLink(url);
      this.restoreHandleOpenURL(old);
    } else {
      if (optIn) {
        let openBrowser = (res) => {
          if (res) window.open(url, '_system');
          this.restoreHandleOpenURL(old);
        };
        this.popupProvider.ionicConfirm(title, message, okText, cancelText).then((res: boolean) => {
          openBrowser(res);
        });
      } else {
        window.open(url, '_system');
        this.restoreHandleOpenURL(old);
      }
    }
  }

}
