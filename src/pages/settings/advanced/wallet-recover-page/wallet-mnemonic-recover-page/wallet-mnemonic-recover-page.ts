import { Component, } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';
import { ActionSheetProvider } from '../../../../../providers/action-sheet/action-sheet';
import { BwcErrorProvider } from '../../../../../providers/bwc-error/bwc-error';
import { KeyProvider } from '../../../../../providers/key/key';
import { Logger } from '../../../../../providers/logger/logger';

@Component({
  selector: 'wallet-mnemonic-recover-page',
  templateUrl: 'wallet-mnemonic-recover-page.html'
})
export class WalletMnemonicRecoverPage {

  public wallets: any;
  public mnemonicPhrase: string;
  public mnemonicPhraseSplit: string[];
  public mnemonicEncrypted: boolean;
  public title: string;
  private keyId; 

  constructor(
    private logger: Logger,
    private navParams: NavParams,
    private keyProvider: KeyProvider,
    private navCtrl: NavController,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private actionSheetProvider: ActionSheetProvider,
  ) {
    this.mnemonicPhrase = "";
    this.mnemonicEncrypted = true;
    this.title = this.navParams.data.name;
    this.keyId = this.navParams.data.keyId;
  }

  ionViewDidEnter() {
    this.keyProvider
      .handleEncryptedWallet(this.keyId)
      .then((password: string) => {
        const keys = this.keyProvider.get(this.keyId, password);
        this.logger.info("Mnemonic: ", keys.mnemonic);
        this.mnemonicPhrase = keys.mnemonic;
        this.mnemonicPhraseSplit = this.mnemonicPhrase.split(" ");
        this.mnemonicEncrypted = false;
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
