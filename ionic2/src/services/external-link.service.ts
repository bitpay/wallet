import { Injectable } from '@angular/core';
import { Logger } from 'angular2-logger/core';
import { PlatformInfo } from './platform-info.service';
import { PopupService } from './popup.service';
import { TextService } from './text.service';

@Injectable()
export class ExternalLinkService {
  win: any = window;

  nodeWebkitService: any = () => {};

  constructor(
    public logger: Logger,
    public platformInfo: PlatformInfo,
    public popupService: PopupService,
    public textService: TextService
  ) {}

  _restoreHandleOpenURL(old) {
    setTimeout(() => {
      this.win.handleOpenURL = old;
    }, 500);
  };

  open(url, optIn?, title?, message?, okText?, cancelText?) {
    var old = this.win.handleOpenURL;

    this.win.handleOpenURL = (url) => {
      // Ignore external URLs
      this.logger.debug('Skip: ' + url);
    };

    if (this.platformInfo.isNW) {
      this.nodeWebkitService.openExternalLink(url);
      this._restoreHandleOpenURL(old);
    } else {
      if (optIn) {
        var message = this.textService.gettextCatalog.getString(message),
          title = this.textService.gettextCatalog.getString(title),
          okText = this.textService.gettextCatalog.getString(okText),
          cancelText = this.textService.gettextCatalog.getString(cancelText),
          openBrowser = function(res) {
            if (res) window.open(url, '_system');
            this._restoreHandleOpenURL(old);
          };
        this.popupService.showConfirm(title, message, okText, cancelText, openBrowser);
      } else {
        window.open(url, '_system');
        this._restoreHandleOpenURL(old);
      }
    }
  };
}
