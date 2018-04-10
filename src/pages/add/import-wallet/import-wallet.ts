import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// Pages
import { TabsPage } from '../../tabs/tabs';

// Providers
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ConfigProvider } from '../../../providers/config/config';
import { DerivationPathHelperProvider } from '../../../providers/derivation-path-helper/derivation-path-helper';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../providers/platform/platform';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-import-wallet',
  templateUrl: 'import-wallet.html'
})
export class ImportWalletPage {

  private derivationPathByDefault: string;
  private derivationPathForTestnet: string;
  private importForm: FormGroup;
  private reader: FileReader;
  private defaults: any;
  private errors: any;
  private prettyFileName: string;

  public importErr: boolean;
  public fromOnboarding: boolean;
  public formFile: any;
  public showAdvOpts: boolean;
  public selectedTab: string;
  public isCordova: boolean;
  public isSafari: boolean;
  public isIOS: boolean;
  public file: File;
  public testnetEnabled: boolean;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private form: FormBuilder,
    private bwcProvider: BwcProvider,
    private derivationPathHelperProvider: DerivationPathHelperProvider,
    private walletProvider: WalletProvider,
    private configProvider: ConfigProvider,
    private popupProvider: PopupProvider,
    private platformProvider: PlatformProvider,
    private logger: Logger,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    private events: Events,
    private pushNotificationsProvider: PushNotificationsProvider
  ) {
    this.reader = new FileReader();
    this.defaults = this.configProvider.getDefaults();
    this.errors = bwcProvider.getErrors();

    this.isCordova = this.platformProvider.isCordova;
    this.isSafari = this.platformProvider.isSafari;
    this.isIOS = this.platformProvider.isIOS;
    this.importErr = false;
    this.fromOnboarding = this.navParams.data.fromOnboarding;
    this.selectedTab = 'words';
    this.derivationPathByDefault = this.derivationPathHelperProvider.default;
    this.derivationPathForTestnet = this.derivationPathHelperProvider.defaultTestnet;
    this.showAdvOpts = false;
    this.formFile = null;

    this.importForm = this.form.group({
      words: [null, Validators.required],
      backupText: [null],
      mnemonicPassword: [null],
      file: [null],
      filePassword: [null],
      derivationPath: [this.derivationPathByDefault, Validators.required],
      testnet: [false],
      bwsURL: [this.defaults.bws.url],
      coin: [this.navParams.data.coin ? this.navParams.data.coin : 'btc']
    });
  }

  ionViewWillEnter() {
    if (this.navParams.data.code) {
      this.processWalletInfo(this.navParams.data.code);
    }
  }

  selectTab(tab: string) {
    this.selectedTab = tab;

    switch (tab) {
      case 'words':
        this.file = null;
        this.formFile = null;
        this.importForm.get('words').setValidators([Validators.required]);
        this.importForm.get('filePassword').clearValidators();
        if (this.isCordova || this.isSafari) this.importForm.get('backupText').clearValidators();
        else this.importForm.get('file').clearValidators();
        break;
      case 'file':
        if (this.isCordova || this.isSafari) this.importForm.get('backupText').setValidators([Validators.required]);
        else this.importForm.get('file').setValidators([Validators.required]);
        this.importForm.get('filePassword').setValidators([Validators.required]);
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

  normalizeMnemonic(words: string) {
    if (!words || !words.indexOf) return words;
    var isJA = words.indexOf('\u3000') > -1;
    var wordList = words.split(/[\u3000\s]+/);

    return wordList.join(isJA ? '\u3000' : ' ');
  }

  private processWalletInfo(code: string): void {
    if (!code) return;

    this.importErr = false;
    let parsedCode = code.split('|');

    if (parsedCode.length != 5) {
      /// Trying to import a malformed wallet export QR code
      let title = this.translate.instant('Error');
      let subtitle = this.translate.instant('Incorrect code format');
      this.popupProvider.ionicAlert(title, subtitle);
      return;
    }

    let info = {
      type: parsedCode[0],
      data: parsedCode[1],
      network: parsedCode[2],
      derivationPath: parsedCode[3],
      hasPassphrase: parsedCode[4] == 'true' ? true : false
    };

    if (info.type == '1' && info.hasPassphrase) {
      let title = this.translate.instant('Error');
      let subtitle = this.translate.instant('Password required. Make sure to enter your password in advanced options');
      this.popupProvider.ionicAlert(title, subtitle);
    }

    this.testnetEnabled = info.network == 'testnet' ? true : false;
    this.importForm.controls['derivationPath'].setValue(info.derivationPath);
    this.importForm.controls['words'].setValue(info.data);
  }

  public setDerivationPath(): void {
    let path = this.testnetEnabled ? this.derivationPathForTestnet : this.derivationPathByDefault;
    this.importForm.controls['derivationPath'].setValue(path);
  }

  private importBlob(str: string, opts: any): void {
    let str2: string;
    let err: any = null;
    try {
      str2 = this.bwcProvider.getSJCL().decrypt(this.importForm.value.filePassword, str);
    } catch (e) {
      err = this.translate.instant('Could not decrypt file, check your password');
      this.logger.warn(e);
    };

    if (err) {
      let title = this.translate.instant('Error');
      this.popupProvider.ionicAlert(title, err);
      return;
    }

    this.onGoingProcessProvider.set('importingWallet');
    opts.compressed = null;
    opts.password = null;

    setTimeout(() => {
      this.profileProvider.importWallet(str2, opts).then((wallet: any) => {
        this.onGoingProcessProvider.clear();
        this.finish(wallet);
      }).catch((err: any) => {
        this.onGoingProcessProvider.clear();
        let title = this.translate.instant('Error');
        this.popupProvider.ionicAlert(title, err);
        return;
      });
    }, 100);
  }

  private finish(wallet: any): void {
    this.walletProvider.updateRemotePreferences(wallet).then(() => {
      this.profileProvider.setBackupFlag(wallet.credentials.walletId);
      this.events.publish('status:updated');
      this.profileProvider.setWalletOrder(wallet.credentials.walletId, null, wallet.coin);
      this.pushNotificationsProvider.updateSubscription(wallet);
      if (this.fromOnboarding) {
        this.profileProvider.setOnboardingCompleted().then(() => {
          this.profileProvider.setDisclaimerAccepted().catch((err: any) => {
            this.logger.error(err);
          });
        }).catch((err: any) => {
          this.logger.error(err);
        });

        this.navCtrl.setRoot(TabsPage);
        this.navCtrl.popToRoot();
      }
      else {
        this.navCtrl.popToRoot().then(() => {
          this.navCtrl.parent.select(0);
        });
      }
    }).catch((err: any) => {
      this.logger.warn(err);
    });
  }

  private importExtendedPrivateKey(xPrivKey, opts) {
    this.onGoingProcessProvider.set('importingWallet');
    setTimeout(() => {
      this.profileProvider.importExtendedPrivateKey(xPrivKey, opts).then((wallet: any) => {
        this.onGoingProcessProvider.clear();
        this.finish(wallet);
      }).catch((err: any) => {
        if (err instanceof this.errors.NOT_AUTHORIZED) {
          this.importErr = true;
        } else {
          let title = this.translate.instant('Error');
          this.popupProvider.ionicAlert(title, err);
        }
        this.onGoingProcessProvider.clear();
        return;
      });
    }, 100);
  }

  private importMnemonic(words: string, opts: any): void {
    this.onGoingProcessProvider.set('importingWallet');
    setTimeout(() => {
      this.profileProvider.importMnemonic(words, opts).then((wallet: any) => {
        this.onGoingProcessProvider.clear();
        this.finish(wallet);
      }).catch((err: any) => {
        if (err instanceof this.errors.NOT_AUTHORIZED) {
          this.importErr = true;
        } else {
          let title = this.translate.instant('Error');
          this.popupProvider.ionicAlert(title, err);
        }
        this.onGoingProcessProvider.clear();
        return;
      });
    }, 100);
  }


  import() {
    if (this.selectedTab === 'file') {
      this.importFromFile();
    } else {
      this.importFromMnemonic();
    }
  }

  public importFromFile(): void {
    if (!this.importForm.valid) {
      let title = this.translate.instant('Error');
      let subtitle = this.translate.instant('There is an error in the form');
      this.popupProvider.ionicAlert(title, subtitle);
      return;
    }

    let backupFile = this.file;
    let backupText = this.importForm.value.backupText;

    if (!backupFile && !backupText) {
      let title = this.translate.instant('Error');
      let subtitle = this.translate.instant('Please, select your backup file');
      this.popupProvider.ionicAlert(title, subtitle);
      return;
    }

    if (backupFile) {
      this.reader.readAsBinaryString(backupFile);
    } else {
      let opts: any = {};
      opts.bwsurl = this.importForm.value.bwsURL;
      opts.coin = this.importForm.value.coin;
      this.importBlob(backupText, opts);
    }
  }

  public importFromMnemonic(): void {
    if (!this.importForm.valid) {
      let title = this.translate.instant('Error');
      let subtitle = this.translate.instant('There is an error in the form');
      this.popupProvider.ionicAlert(title, subtitle);
      return;
    }

    let opts: any = {};

    if (this.importForm.value.bwsURL)
      opts.bwsurl = this.importForm.value.bwsURL;

    let pathData: any = this.derivationPathHelperProvider.parse(this.importForm.value.derivationPath);

    if (!pathData) {
      let title = this.translate.instant('Error');
      let subtitle = this.translate.instant('Invalid derivation path');
      this.popupProvider.ionicAlert(title, subtitle);
      return;
    }

    opts.account = pathData.account;
    opts.networkName = pathData.networkName;
    opts.derivationStrategy = pathData.derivationStrategy;
    opts.coin = this.importForm.value.coin;

    let words: string = this.importForm.value.words || null;

    if (!words) {
      let title = this.translate.instant('Error');
      let subtitle = this.translate.instant('Please enter the recovery phrase');
      this.popupProvider.ionicAlert(title, subtitle);
      return;
    } else if (words.indexOf('xprv') == 0 || words.indexOf('tprv') == 0) {
      return this.importExtendedPrivateKey(words, opts);
    } else {
      let wordList: any[] = words.split(/[\u3000\s]+/);

      if ((wordList.length % 3) != 0) {
        let title = this.translate.instant('Error');
        let subtitle = this.translate.instant('Wrong number of recovery words:');
        this.popupProvider.ionicAlert(title, subtitle + ' ' + wordList.length);
        return;
      }
    }

    opts.passphrase = this.importForm.value.passphrase || null;
    this.importMnemonic(words, opts);
  }

  public toggleShowAdvOpts(): void {
    this.showAdvOpts = !this.showAdvOpts;
  }

  public fileChangeEvent($event: any) {
    this.file = $event.target ? $event.target.files[0] : $event.srcElement.files[0];
    this.formFile = $event.target.value;
    // Most browsers return `C:\fakepath\FILENAME`
    this.prettyFileName = this.formFile.split('\\').pop();
    this.getFile();
  }

  private getFile() {
    // If we use onloadend, we need to check the readyState.
    this.reader.onloadend = (evt: any) => {
      if (evt.target.readyState == 2) { // DONE == 2
        let opts: any = {};
        opts.bwsurl = this.importForm.value.bwsURL;
        opts.coin = this.importForm.value.coin;
        this.importBlob(evt.target.result, opts);
      }
    }
  }

  public openScanner(): void {
    if (this.navParams.data.fromScan) {
      this.navCtrl.popToRoot({ animate: false });
    } else {
      this.navCtrl.popToRoot({ animate: false }).then(() => {
        this.navCtrl.parent.select(2);
      });
    }
  }

}
