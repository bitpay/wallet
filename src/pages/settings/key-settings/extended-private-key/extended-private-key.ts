import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';

// providers
import { BwcErrorProvider } from '../../../../providers/bwc-error/bwc-error';
import { ErrorsProvider } from '../../../../providers/errors/errors';
import { KeyProvider } from '../../../../providers/key/key';
import { Logger } from '../../../../providers/logger/logger';
import { ProfileProvider } from '../../../../providers/profile/profile';

@Component({
  selector: 'page-extended-private-key',
  templateUrl: 'extended-private-key.html'
})
export class ExtendedPrivateKeyPage {
  public walletsGroup;
  public keysEncrypted: boolean;
  public xPrivKey: string;

  private keyId;

  constructor(
    private profileProvider: ProfileProvider,
    private logger: Logger,
    private navParams: NavParams,
    private navCtrl: NavController,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private keyProvider: KeyProvider,
    private errorsProvider: ErrorsProvider
  ) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: WalletExtendedPrivateKeyPage');
  }

  ionViewWillEnter() {
    this.keyId = this.navParams.data.keyId;
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

  private showErrorInfoSheet(
    err: Error | string,
    infoSheetTitle: string
  ): void {
    if (!err) return;
    this.logger.error('Could not get keys:', err);
    this.errorsProvider.showDefaultError(err, infoSheetTitle);
  }
}
