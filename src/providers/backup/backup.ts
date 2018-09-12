import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// Providers
import { AppProvider } from '../../providers/app/app';
import { BwcProvider } from '../../providers/bwc/bwc';
import { DownloadProvider } from '../../providers/download/download';
import { ProfileProvider } from '../../providers/profile/profile';
import { ConfigProvider } from '../config/config';

@Injectable()
export class BackupProvider {
  constructor(
    private appProvider: AppProvider,
    private bwcProvider: BwcProvider,
    private configProvider: ConfigProvider,
    private downloadProvider: DownloadProvider,
    private logger: Logger,
    private profileProvider: ProfileProvider
  ) {
    this.logger.debug('BackupProvider initialized');
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
      this.downloadProvider.download(ew, filename).then(() => {
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
      this.logger.error('Error exporting wallet: ', err);
      return null;
    }
  }

  private addMetadata(b, opts): string {
    b = JSON.parse(b);
    if (opts.addressBook) b.addressBook = opts.addressBook;
    return JSON.stringify(b);
  }
}
