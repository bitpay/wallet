import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';

// providers
import { AppProvider } from '../../../../providers/app/app';
import { BwcErrorProvider } from '../../../../providers/bwc-error/bwc-error';
import { ErrorsProvider } from '../../../../providers/errors/errors';
import { KeyProvider } from '../../../../providers/key/key';
import { Logger } from '../../../../providers/logger/logger';
import { ProfileProvider } from '../../../../providers/profile/profile';

@Component({
  selector: 'page-key-qr-export',
  templateUrl: 'key-qr-export.html'
})
export class KeyQrExportPage {
  public walletsGroup;
  public keysEncrypted: boolean;
  public code: string;
  public appName: string;

  private keyId;

  constructor(
    private profileProvider: ProfileProvider,
    private logger: Logger,
    private navParams: NavParams,
    private navCtrl: NavController,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private keyProvider: KeyProvider,
    private appProvider: AppProvider,
    private errorsProvider: ErrorsProvider
  ) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: KeyQrExportPage');
  }

  ionViewWillEnter() {
    this.keyId = this.navParams.data.keyId;
    this.walletsGroup = this.profileProvider.getWalletGroup(this.keyId);
    this.keysEncrypted = this.walletsGroup.isPrivKeyEncrypted;
    this.appName = this.appProvider.info.nameCase;
  }

  ionViewDidEnter() {
    this.keyProvider
      .handleEncryptedWallet(this.keyId)
      .then((password: string) => {
        const keys = this.keyProvider.get(this.keyId, password);
        this.keysEncrypted = false;
        this.generateQrCode(keys);
      })
      .catch(err => {
        if (err && err.message != 'PASSWORD_CANCELLED') {
          if (err.message == 'WRONG_PASSWORD') {
            this.errorsProvider.showWrongEncryptPasswordError();
          } else {
            let title = this.translate.instant('Could not decrypt wallet');
            this.showErrorInfoSheet(this.bwcErrorProvider.msg(err), title);
          }
        }
        this.navCtrl.pop();
      });
  }

  public generateQrCode(keys) {
    if (!keys || !keys.mnemonic) {
      const err = this.translate.instant(
        'Exporting via QR not supported for this wallet'
      );
      const title = this.translate.instant('Error');
      this.showErrorInfoSheet(err, title);
      return;
    }

    const mnemonicHasPassphrase = this.keyProvider.mnemonicHasPassphrase(
      this.keyId
    );
    this.code =
      '1|' + keys.mnemonic + '|null|null|' + mnemonicHasPassphrase + '|null';
    this.logger.debug(
      'QR code generated. mnemonicHasPassphrase: ' + mnemonicHasPassphrase
    );
  }

  private showErrorInfoSheet(
    err: Error | string,
    infoSheetTitle: string
  ): void {
    if (!err) return;
    this.logger.error('Could not get keys:', err);
    this.errorsProvider.showDefaultError(err, infoSheetTitle);
  }
}
