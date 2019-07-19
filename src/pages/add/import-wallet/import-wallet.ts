import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { App, Events, NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// Pages
import { ScanPage } from '../../scan/scan';
import { TabsPage } from '../../tabs/tabs';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ConfigProvider } from '../../../providers/config/config';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../providers/platform/platform';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';
import {
  WalletOptions,
  WalletProvider
} from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-import-wallet',
  templateUrl: 'import-wallet.html'
})
export class ImportWalletPage {
  private reader: FileReader;
  private defaults;
  private processedInfo;

  public importForm: FormGroup;
  public prettyFileName: string;
  public formFile;
  public selectedTab: string;
  public isCordova: boolean;
  public isSafari: boolean;
  public isIOS: boolean;
  public file: File;
  public code;
  public okText: string;
  public cancelText: string;
  public showAdvOpts: boolean;

  constructor(
    private app: App,
    private navCtrl: NavController,
    private navParams: NavParams,
    private form: FormBuilder,
    private bwcProvider: BwcProvider,
    private walletProvider: WalletProvider,
    private configProvider: ConfigProvider,
    private popupProvider: PopupProvider,
    private platformProvider: PlatformProvider,
    private logger: Logger,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    private events: Events,
    private pushNotificationsProvider: PushNotificationsProvider,
    private actionSheetProvider: ActionSheetProvider
  ) {
    this.okText = this.translate.instant('Ok');
    this.cancelText = this.translate.instant('Cancel');
    this.reader = new FileReader();
    this.defaults = this.configProvider.getDefaults();
    this.isCordova = this.platformProvider.isCordova;
    this.isSafari = this.platformProvider.isSafari;
    this.isIOS = this.platformProvider.isIOS;
    this.selectedTab = 'words';
    this.showAdvOpts = false;

    this.code = this.navParams.data.code;
    this.processedInfo = this.processWalletInfo(this.code);

    this.formFile = null;

    this.importForm = this.form.group({
      words: [null, Validators.required],
      backupText: [null],
      passphrase: [null],
      file: [null],
      filePassword: [null],
      bwsURL: [this.defaults.bws.url]
    });
    this.events.subscribe('Local/BackupScan', this.updateWordsHandler);
    this.setForm();
  }

  ngOnDestroy() {
    this.events.unsubscribe('Local/BackupScan', this.updateWordsHandler);
  }

  private setForm(): void {
    if (this.processedInfo) {
      this.importForm.controls['words'].setValue(this.processedInfo.data);
    }
  }

  private updateWordsHandler: any = data => {
    this.processedInfo = this.processWalletInfo(data.value);
    this.setForm();
  };

  public selectTab(tab: string): void {
    this.selectedTab = tab;

    switch (tab) {
      case 'words':
        this.file = null;
        this.formFile = null;
        this.importForm.get('words').setValidators([Validators.required]);
        this.importForm.get('filePassword').clearValidators();
        if (this.isCordova || this.isSafari)
          this.importForm.get('backupText').clearValidators();
        else this.importForm.get('file').clearValidators();
        break;
      case 'file':
        if (this.isCordova || this.isSafari)
          this.importForm
            .get('backupText')
            .setValidators([Validators.required]);
        else this.importForm.get('file').setValidators([Validators.required]);
        this.importForm
          .get('filePassword')
          .setValidators([Validators.required]);
        this.importForm.get('words').clearValidators();
        break;

      default:
        this.importForm.get('words').clearValidators();
        this.importForm.get('file').clearValidators();
        this.importForm.get('filePassword').clearValidators();
        break;
    }
    this.importForm.get('words').updateValueAndValidity();
    this.importForm.get('file').updateValueAndValidity();
    this.importForm.get('filePassword').updateValueAndValidity();
    this.importForm.get('backupText').updateValueAndValidity();
  }

  private processWalletInfo(code: string) {
    if (!code) return undefined;

    const parsedCode = code.split('|');

    const info = {
      type: parsedCode[0],
      data: parsedCode[1],
      network: parsedCode[2],
      derivationPath: parsedCode[3], // deprecated
      hasPassphrase: parsedCode[4] == 'true' ? true : false,
      coin: parsedCode[5] // deprecated
    };
    if (!info.data) {
      const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
        'default-error',
        {
          msg: this.translate.instant('Invalid data'),
          title: this.translate.instant('Error')
        }
      );
      errorInfoSheet.present();
      return undefined;
    }
    if (info.type == '1' && info.hasPassphrase) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant(
        'Password required. Make sure to enter your password in advanced options'
      );
      this.popupProvider.ionicAlert(title, subtitle);
      return undefined;
    }
    return info;
  }

  private importBlob(str: string, opts): void {
    let str2: string;
    let err = null;
    try {
      str2 = this.bwcProvider
        .getSJCL()
        .decrypt(this.importForm.value.filePassword, str);
    } catch (e) {
      err = this.translate.instant(
        'Could not decrypt file, check your password'
      );
      this.logger.error('Import: could not decrypt file', e);
    }

    if (err) {
      const title = this.translate.instant('Error');
      this.popupProvider.ionicAlert(title, err);
      return;
    }

    this.onGoingProcessProvider.set('importingWallet');
    opts.compressed = null;
    opts.password = null;

    this.profileProvider
      .importFile(str2, opts)
      .then((wallet: any[]) => {
        this.onGoingProcessProvider.clear();
        this.finish([].concat(wallet));
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        const title = this.translate.instant('Error');
        this.popupProvider.ionicAlert(title, err);
        return;
      });
  }

  private async finish(wallets: any[]) {
    wallets.forEach(wallet => {
      this.walletProvider.updateRemotePreferences(wallet);
      this.pushNotificationsProvider.updateSubscription(wallet);
      this.profileProvider.setWalletBackup(wallet.credentials.walletId);
    });
    if (wallets && wallets[0]) {
      this.profileProvider.setBackupGroupFlag(wallets[0].credentials.keyId);
      this.profileProvider.setWalletGroupName(
        wallets[0].credentials.keyId,
        wallets[0].credentials.walletName
      );
    }
    this.events.publish('Local/WalletListChange');
    // using setRoot(TabsPage) as workaround when coming from scanner
    this.app
      .getRootNavs()[0]
      .setRoot(TabsPage)
      .then(() => {
        this.events.publish('Home/reloadStatus');
      });
  }

  private importExtendedPrivateKey(xPrivKey, opts) {
    this.onGoingProcessProvider.set('importingWallet');
    this.profileProvider
      .importExtendedPrivateKey(xPrivKey, opts)
      .then((wallets: any[]) => {
        this.onGoingProcessProvider.clear();
        this.finish(wallets);
      })
      .catch(err => {
        if (err == 'WALLET_DOES_NOT_EXIST') {
          const title = this.translate.instant(
            'Could not access the wallet at the server'
          );
          const msg = this.translate.instant(
            'NOTE: To import a wallet from a 3rd party software, please go to Add Wallet, Create Wallet, and specify the Recovery Phrase there.'
          );
          this.showErrorInfoSheet(title, msg);
        } else {
          const title = this.translate.instant('Error');
          this.showErrorInfoSheet(title, err);
        }
        this.onGoingProcessProvider.clear();
        return;
      });
  }

  private importMnemonic(words: string, opts): void {
    this.onGoingProcessProvider.set('importingWallet');
    this.profileProvider
      .importMnemonic(words, opts)
      .then((wallets: any[]) => {
        this.onGoingProcessProvider.clear();
        this.finish(wallets);
      })
      .catch(err => {
        if (err == 'WALLET_DOES_NOT_EXIST') {
          const title = this.translate.instant(
            'Could not access the wallet at the server'
          );
          const msg = this.translate.instant(
            'NOTE: To import a wallet from a 3rd party software, please go to Add Wallet, Create Wallet, and specify the Recovery Phrase there.'
          );
          this.showErrorInfoSheet(title, msg);
        } else {
          const title = this.translate.instant('Error');
          this.showErrorInfoSheet(title, err);
        }
        this.onGoingProcessProvider.clear();
        return;
      });
  }

  public import(): void {
    if (this.selectedTab === 'file') {
      this.importFromFile();
    } else {
      this.importFromMnemonic();
    }
  }

  public importFromFile(): void {
    if (!this.importForm.valid) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant('There is an error in the form');
      this.popupProvider.ionicAlert(title, subtitle);
      return;
    }

    const backupFile = this.file;
    const backupText = this.importForm.value.backupText;

    if (!backupFile && !backupText) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant(
        'Please, select your backup file'
      );
      this.popupProvider.ionicAlert(title, subtitle);
      return;
    }

    if (backupFile) {
      this.reader.readAsBinaryString(backupFile);
    } else {
      const opts: Partial<WalletOptions> = {};
      opts.bwsurl = this.importForm.value.bwsURL;
      this.importBlob(backupText, opts);
    }
  }

  public importFromMnemonic(): void {
    if (!this.importForm.valid) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant('There is an error in the form');
      this.popupProvider.ionicAlert(title, subtitle);
      return;
    }

    const opts: Partial<WalletOptions> = {};

    if (this.importForm.value.bwsURL)
      opts.bwsurl = this.importForm.value.bwsURL;

    opts.passphrase = this.importForm.value.passphrase || null;

    const words: string = this.importForm.value.words || null;

    if (!words) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant(
        'Please enter the recovery phrase'
      );
      this.popupProvider.ionicAlert(title, subtitle);
      return;
    } else if (words.indexOf('xprv') == 0 || words.indexOf('tprv') == 0) {
      return this.importExtendedPrivateKey(words, opts);
    } else {
      const wordList = words.trim().split(/[\u3000\s]+/);

      if (wordList.length % 3 != 0) {
        const title = this.translate.instant('Error');
        const subtitle = this.translate.instant(
          'Wrong number of recovery words:'
        );
        this.popupProvider.ionicAlert(title, subtitle + ' ' + wordList.length);
        return;
      }
    }

    this.importMnemonic(words, opts);
  }

  public fileChangeEvent($event) {
    this.file = $event.target
      ? $event.target.files[0]
      : $event.srcElement.files[0];
    this.formFile = $event.target.value;
    // Most browsers return `C:\fakepath\FILENAME`
    this.prettyFileName = this.formFile.split('\\').pop();
    this.getFile();
  }

  private getFile() {
    // If we use onloadend, we need to check the readyState.
    this.reader.onloadend = () => {
      if (this.reader.readyState === 2) {
        // DONE === 2
        const opts: Partial<WalletOptions> = {};
        opts.bwsurl = this.importForm.value.bwsURL;
        const reader: string = this.reader.result.toString();
        this.importBlob(reader, opts);
      }
    };
  }

  public openScanner(): void {
    this.navCtrl.push(ScanPage, { fromImport: true });
  }

  private showErrorInfoSheet(title: Error | string, msg: string): void {
    const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
      'default-error',
      { msg, title }
    );
    errorInfoSheet.present();
  }
}
