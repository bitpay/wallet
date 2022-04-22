import { Location } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NgxQrcodeErrorCorrectionLevels } from '@techiediaries/ngx-qrcode';

// providers
import { AppProvider } from '../../../../providers/app/app';
import { BwcErrorProvider } from '../../../../providers/bwc-error/bwc-error';
import { ErrorsProvider } from '../../../../providers/errors/errors';
import { KeyProvider } from '../../../../providers/key/key';
import { Logger } from '../../../../providers/logger/logger';
import { ProfileProvider } from '../../../../providers/profile/profile';

@Component({
  selector: 'page-key-qr-export',
  templateUrl: 'key-qr-export.html',
  styleUrls: ['key-qr-export.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KeyQrExportPage {
  public walletsGroup;
  public keysEncrypted: boolean;
  public code: string;
  public appName: string;

  private keyId;
  navParamsData;
  typeErrorQr =  NgxQrcodeErrorCorrectionLevels;
  constructor(
    private profileProvider: ProfileProvider,
    private logger: Logger,
    private location: Location,
    private router: Router,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private keyProvider: KeyProvider,
    private appProvider: AppProvider,
    private errorsProvider: ErrorsProvider
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData =  history ? history.state : undefined;
    }
  }

  ngOnInit() {
    this.logger.info('Loaded: KeyQrExportPage');
  }

  ionViewWillEnter() {
    this.keyId = this.navParamsData.keyId;
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
        this.logger.info('Loaded: KeyQrExportPage');
      })
      .catch(err => {
        if (err && err.message != 'PASSWORD_CANCELLED') {
          if (err.message == 'WRONG_PASSWORD') {
            this.errorsProvider.showWrongEncryptPasswordError();
          } else {
            let title = this.translate.instant('Could not decrypt account');
            this.showErrorInfoSheet(this.bwcErrorProvider.msg(err), title);
          }
        }
        this.location.back();
      });
  }

  public generateQrCode(keys) {
    if (!keys || !keys.mnemonic) {
      const err = this.translate.instant(
        'Exporting via QR not supported for this account'
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
