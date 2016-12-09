import { Injectable } from '@angular/core';
import { Logger } from 'angular2-logger/core';

import { PlatformInfo } from './platform-info.service';
import { ProfileService } from './profile.service';

@Injectable()
export class PayproService {

  popupService: any = {
    showAlert: () => {}
  };

  ongoingProcess: any = {
    set: () => {}
  };

  gettextCatalog: any = () => {};

  constructor(
    public logger: Logger,
    public platformInfo: PlatformInfo,
    public profileService: ProfileService
  ) {}

  getPayProDetails(uri: string, cb, disableLoader?: boolean) {
    if (!cb) cb = function() {};

    let wallet = this.profileService.getWallets({
      onlyComplete: true
    })[0];

    if (!wallet) return cb();

    if (this.platformInfo.isChromeApp) {
      this.popupService.showAlert(this.gettextCatalog.getString('Payment Protocol not supported on Chrome App'));
      return cb(true);
    }

    this.logger.debug('Fetch PayPro Request...', uri);

    if(!disableLoader) {
      this.ongoingProcess.set('fetchingPayPro', true);
    }

    wallet.fetchPayPro({
      payProUrl: uri,
    }, (err, paypro) => {

      if(!disableLoader) {
        this.ongoingProcess.set('fetchingPayPro', false);
      }

      if (err) {
        return cb(true);
      }

      if (!paypro.verified) {
        this.logger.warn('Failed to verify payment protocol signatures');
        this.popupService.showAlert(this.gettextCatalog.getString('Payment Protocol Invalid'));
        return cb(true);
      }
      cb(null, paypro);
    });
  }
}
