import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// providers
import { ElectronProvider } from '../electron/electron';
import { PlatformProvider } from '../platform/platform';
import { PopupProvider } from '../popup/popup';

@Injectable()
export class ExternalLinkProvider {
  constructor(
    private popupProvider: PopupProvider,
    private logger: Logger,
    private platformProvider: PlatformProvider,
    private electronProvider: ElectronProvider
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

    (window as any).handleOpenURL = url => {
      // Ignore external URLs
      this.logger.debug('Skip: ' + url);
    };

    if (res)
      this.platformProvider.isElectron
        ? this.electronProvider.openExternalLink(url)
        : window.open(url, '_system');

    this.restoreHandleOpenURL(old);
  }
}
