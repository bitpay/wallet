import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// pages
import { BackupGamePage } from '../backup-game/backup-game';

// providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../../providers/app/app';
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { ErrorsProvider } from '../../../providers/errors/errors';
import { KeyProvider } from '../../../providers/key/key';
import { Logger } from '../../../providers/logger/logger';
import { LogsProvider } from '../../../providers/logs/logs';
import { PlatformProvider } from '../../../providers/platform/platform';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';

@Component({
  selector: 'page-backup-key',
  templateUrl: 'backup-key.html'
})
export class BackupKeyPage {
  public mnemonicWords: string[];
  public wordToShow: number;
  public credentialsEncrypted: boolean;
  public walletGroup;
  public keys;

  private keyId: string;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private translate: TranslateService,
    private actionSheetProvider: ActionSheetProvider,
    private keyProvider: KeyProvider,
    private errorsProvider: ErrorsProvider,
    private popupProvider: PopupProvider,
    private platformProvider: PlatformProvider,
    private logsProvider: LogsProvider,
    private appProvider: AppProvider
  ) {
    this.keyId = this.navParams.data.keyId;
    this.walletGroup = this.profileProvider.getWalletGroup(this.keyId);
    this.credentialsEncrypted = this.walletGroup.isPrivKeyEncrypted;
  }

  ionViewDidEnter() {
    if (!this.walletGroup.canSign) {
      this.showNoRecoveryPhraseError();
      return;
    }

    this.keyProvider
      .handleEncryptedWallet(this.keyId)
      .then((password: string) => {
        let keys;
        try {
          keys = this.keyProvider.get(this.keyId, password);
        } catch (err) {
          const title =
            'Your wallet is in a corrupt state. Please contact support and share the logs provided.';
          let message;
          try {
            message =
              err instanceof Error ? err.toString() : JSON.stringify(err);
          } catch (error) {
            message = 'Unknown error';
          }
          this.popupProvider.ionicAlert(title, message).then(() => {
            // Share logs
            const platform = this.platformProvider.isCordova
              ? this.platformProvider.isAndroid
                ? 'android'
                : 'ios'
              : 'desktop';
            this.logsProvider.get(this.appProvider.info.nameCase, platform);
          });
        }
        if (_.isEmpty(keys)) {
          this.logger.warn('Empty keys');
        }
        this.credentialsEncrypted = false;
        this.keys = keys;
        if (!this.keys || !this.keys.mnemonic) {
          this.showNoRecoveryPhraseError();
          return;
        }
        this.showSafeguardMessage();
        this.setFlow();
      })
      .catch(err => {
        if (
          err &&
          err.message != 'FINGERPRINT_CANCELLED' &&
          err.message != 'PASSWORD_CANCELLED'
        ) {
          const title = this.translate.instant('Could not decrypt wallet');
          if (err.message == 'WRONG_PASSWORD') {
            this.errorsProvider.showWrongEncryptPasswordError();
          } else {
            this.showErrorInfoSheet(this.bwcErrorProvider.msg(err), title);
          }
        }
        this.navCtrl.pop();
      });
  }

  private showNoRecoveryPhraseError() {
    const title = this.translate.instant(
      'Wallet recovery phrase not available'
    );
    let err = this.translate.instant(
      'You can still export it from "Export Wallet" option.'
    );
    this.showErrorInfoSheet(err, title);
    this.navCtrl.pop();
    this.logger.warn('no mnemonics');
  }

  private showErrorInfoSheet(
    err: Error | string,
    infoSheetTitle: string
  ): void {
    if (!err) return;
    this.logger.warn('Could not get keys:', err);
    this.errorsProvider.showDefaultError(err, infoSheetTitle);
  }

  public goToBackupGame(): void {
    this.navCtrl.push(BackupGamePage, {
      words: this.mnemonicWords,
      keys: this.keys,
      keyId: this.keyId,
      isOnboardingFlow: this.navParams.data.isOnboardingFlow
    });
  }

  private setFlow(): void {
    if (!this.keys) return;

    let words = this.keys.mnemonic;

    this.mnemonicWords = words.split(/[\u3000\s]+/);
    this.wordToShow = 0;
  }

  public showSafeguardMessage(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'backup-safeguard-warning'
    );
    infoSheet.present();
  }

  public nextWord() {
    this.wordToShow++;
  }

  public previousWord() {
    this.wordToShow--;
  }
}
