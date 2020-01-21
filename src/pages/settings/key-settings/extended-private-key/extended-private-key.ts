import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';

// providers
import { ActionSheetProvider } from '../../../../providers/action-sheet/action-sheet';
import { BwcErrorProvider } from '../../../../providers/bwc-error/bwc-error';
import { KeyProvider } from '../../../../providers/key/key';
import { Logger } from '../../../../providers/logger/logger';
import { ProfileProvider } from '../../../../providers/profile/profile';

@Component({
  selector: 'page-wallet-group-extended-private-key',
  templateUrl: 'wallet-group-extended-private-key.html'
})
export class WalletGroupExtendedPrivateKeyPage {
  public walletsGroup;
  public keysEncrypted: boolean;
  public xPrivKey: string;

  private keyId;

  constructor(
    private profileProvider: ProfileProvider,
    private logger: Logger,
    private navParams: NavParams,
    private navCtrl: NavController,
    private actionSheetProvider: ActionSheetProvider,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private keyProvider: KeyProvider
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
          let title = this.translate.instant('Could not decrypt wallet');
          this.showErrorInfoSheet(this.bwcErrorProvider.msg(err), title);
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
    const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
      'default-error',
      { msg: err, title: infoSheetTitle }
    );
    errorInfoSheet.present();
  }
}
