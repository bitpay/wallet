import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BwcProvider } from '../../../../../providers/bwc/bwc';
import { ErrorsProvider } from '../../../../../providers/errors/errors';
import { Logger } from '../../../../../providers/logger/logger';
import { PopupProvider } from '../../../../../providers/popup/popup';

@Component({
  selector: 'wallet-mnemonic-recover-page',
  templateUrl: 'wallet-mnemonic-recover-page.html',
  styleUrls: ['wallet-mnemonic-recover.scss']
})
export class WalletMnemonicRecoverPage {
  public wallets: any;
  public mnemonicPhrase: string;
  public mnemonicEncrypted: boolean;
  public title: string;
  public passwordForm: FormGroup;
  navParamsData;

  constructor(
    private logger: Logger,
    private router: Router,
    private form: FormBuilder,
    private popupProvider: PopupProvider,
    private translate: TranslateService,
    private bwcProvider: BwcProvider,
    private errorsProvider: ErrorsProvider
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData =  history ? history.state : undefined;
    }
    this.mnemonicPhrase = '';
    this.mnemonicEncrypted =
      this.navParamsData.credential.mnemonic === undefined;
    if (!this.mnemonicEncrypted) {
      this.mnemonicPhrase = this.navParamsData.credential.mnemonic;
    }
    this.title = this.navParamsData.name;
    this.passwordForm = this.form.group({
      encryptPassword: [null]
    });
  }

  public decryptMnemonic() {
    if (!this.passwordForm.valid) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant('There is an error in the form');
      this.popupProvider.ionicAlert(title, subtitle);
      return;
    } else {
      this._decryptMnemonic(
        this.passwordForm.value.encryptPassword,
        this.navParamsData.credential
      );
    }
  }

  private _decryptMnemonic(password, credential) {
    let mnemonic = '';

    if (!credential.xPrivKeyEncrypted)
      throw new Error('Private key is not encrypted');

    try {
      if (credential.mnemonicEncrypted) {
        mnemonic = this.bwcProvider
          .getSJCL()
          .decrypt(password, credential.mnemonicEncrypted);
        this.mnemonicPhrase = mnemonic;
        this.mnemonicEncrypted = false;
      }
    } catch (ex) {
      this.showErrorInfoSheet('Could Not Decrypt', 'Error');
    }
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
