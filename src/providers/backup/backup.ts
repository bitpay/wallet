import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// Providers
import { AppProvider } from '../../providers/app/app';
import { BwcProvider } from '../../providers/bwc/bwc';
import { ProfileProvider } from '../../providers/profile/profile';
import { ConfigProvider } from '../config/config';

@Injectable()
export class BackupProvider {
  constructor(
    private appProvider: AppProvider,
    private bwcProvider: BwcProvider,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private configProvider: ConfigProvider
  ) {
    this.logger.info('BackupProvider initialized.');
  }

  public walletDownload(password, opts, walletId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let config = this.configProvider.get();

      let wallet = this.profileProvider.getWallet(walletId);
      let ew = this.walletExport(password, opts, walletId);
      if (!ew) return reject('Could not create backup');

      let walletName =
        wallet.credentials.walletName || wallet.credentials.walletId;

      let alias =
        config.aliasFor && config.aliasFor[wallet.credentials.walletId];

      if (alias) {
        walletName = alias + ' [' + walletName + ']';
      }

      if (opts.noSign) walletName = walletName + '-noSign';
      let filename =
        walletName + '-' + this.appProvider.info.nameCase + 'backup.aes.json';
      this._download(ew, filename).then(() => {
        return resolve();
      });
    });
  }

  public walletExport(password: string, opts, walletId: string) {
    if (!password) {
      return null;
    }
    let wallet = this.profileProvider.getWallet(walletId);
    try {
      opts = opts ? opts : {};
      let b = wallet.export(opts);
      if (opts.addressBook) b = this.addMetadata(b, opts);

      let e = this.bwcProvider.getSJCL().encrypt(password, b, {
        iter: 10000
      });
      return e;
    } catch (err) {
      this.logger.debug('Error exporting wallet: ', err);
      return null;
    }
  }

  private addMetadata(b, opts): string {
    b = JSON.parse(b);
    if (opts.addressBook) b.addressBook = opts.addressBook;
    return JSON.stringify(b);
  }

  private _download(ew, fileName: string): Promise<any> {
    return new Promise(resolve => {
      let a = document.createElement('a');
      let blob = this.NewBlob(ew, 'text/plain;charset=utf-8');
      let url = window.URL.createObjectURL(blob);

      document.body.appendChild(a);

      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);

      return resolve();
    });
  }

  private NewBlob(data, datatype: string) {
    let out;
    try {
      out = new Blob([data], {
        type: datatype
      });
      this.logger.debug('case 1');
    } catch (e) {
      if (e.name == 'InvalidStateError') {
        // InvalidStateError (tested on FF13 WinXP)
        out = new Blob([data], {
          type: datatype
        });
        this.logger.debug('case 2');
      } else {
        // We're screwed, blob constructor unsupported entirely
        this.logger.debug('Error');
      }
    }
    return out;
  }
}
