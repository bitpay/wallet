import { Location } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

// providers
import { BwcErrorProvider } from '../../../../providers/bwc-error/bwc-error';
import { ErrorsProvider } from '../../../../providers/errors/errors';
import { KeyProvider } from '../../../../providers/key/key';
import { Logger } from '../../../../providers/logger/logger';
import { ProfileProvider } from '../../../../providers/profile/profile';

@Component({
  selector: 'page-extended-private-key',
  templateUrl: 'extended-private-key.html',
  styleUrls: ['extended-private-key.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExtendedPrivateKeyPage {
  public walletsGroup;
  public keysEncrypted: boolean;
  public xPrivKey: string;

  private keyId;
  navParamsData;
  constructor(
    private profileProvider: ProfileProvider,
    private logger: Logger,
    private location: Location,
    private router: Router,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private keyProvider: KeyProvider,
    private errorsProvider: ErrorsProvider
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData =  history ? history.state : undefined;
    }
  }


  ionViewWillEnter() {
    this.keyId = this.navParamsData.keyId;
    this.walletsGroup = this.profileProvider.getWalletGroup(this.keyId);
    this.keysEncrypted = this.walletsGroup.isPrivKeyEncrypted;
  }

  ionViewDidEnter() {
    this.keyProvider
      .handleEncryptedWallet(this.keyId)
      .then((password: string) => {
        const keys = this.keyProvider.get(this.keyId, password);
        this.xPrivKey = keys.xPrivKey;
        this.keysEncrypted = false;
        this.logger.info('Loaded: WalletExtendedPrivateKeyPage');
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

  private showErrorInfoSheet(
    err: Error | string,
    infoSheetTitle: string
  ): void {
    if (!err) return;
    this.logger.error('Could not get keys:', err);
    this.errorsProvider.showDefaultError(err, infoSheetTitle);
  }
}
