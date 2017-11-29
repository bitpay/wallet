import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '@nsalaun/ng-logger';

// Pages
import { HomePage } from '../../../pages/home/home';

// Providers
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ConfigProvider } from '../../../providers/config/config';
import { DerivationPathHelperProvider } from '../../../providers/derivation-path-helper/derivation-path-helper';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ProfileProvider } from '../../../providers/profile/profile';
import { PopupProvider } from '../../../providers/popup/popup';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-import-wallet',
  templateUrl: 'import-wallet.html'
})
export class ImportWalletPage implements OnInit {

  private derivationPathByDefault: string;
  private derivationPathForTestnet: string;
  private importForm: FormGroup;
  private reader: FileReader;
  private defaults: any;
  private errors: any;

  public importErr: boolean;
  public fromOnboarding: boolean;
  public formData: any;
  public showAdvOpts: boolean;
  public selectedTab: string;
  public isCordova: boolean;
  public file: File;

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
    private profileProvider: ProfileProvider
  ) {
    this.reader = new FileReader();
    this.defaults = this.configProvider.getDefaults();
    this.errors = bwcProvider.getErrors();

    this.isCordova = this.platformProvider.isCordova;
    this.importErr = false;
    this.fromOnboarding = this.navParams.data.fromOnboarding;
    this.selectedTab = 'words';
    this.derivationPathByDefault = this.derivationPathHelperProvider.default;
    this.derivationPathForTestnet = this.derivationPathHelperProvider.defaultTestnet;
    this.showAdvOpts = false;
    this.formData = {
      words: null,
      mnemonicPassword: null,
      file: null,
      filePassword: null,
      derivationPath: this.derivationPathByDefault,
      testnet: false,
      bwsURL: this.defaults.bws.url,
      coin: this.navParams.data.coin ? this.navParams.data.coin : 'btc'
    };

    if (this.navParams.data.code)
      this.processWalletInfo(this.navParams.data.code);
  }

  ngOnInit() {
    this.importForm = this.form.group({
      words: ['', Validators.required],
      mnemonicPassword: [''],
      file: [''],
      filePassword: [''],
      derivationPath: [''],
      testnet: [''],
      bwsURL: [''],
      coin: ['']
    });
  }

  selectTab(tab: string) {
    this.selectedTab = tab;

    switch (tab) {
      case 'words':
        this.importForm.get('words').setValidators([Validators.required]);
        this.importForm.get('file').clearValidators();
        this.importForm.get('filePassword').clearValidators();
        break;
      case 'file':
        this.importForm.get('file').setValidators([Validators.required]);
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
      this.popupProvider.ionicAlert('Error', 'Incorrect code format', 'Ok'); //TODO gettextcatalog
      return;
    }

    let info = {
      type: parsedCode[0],
      data: parsedCode[1],
      network: parsedCode[2],
      derivationPath: parsedCode[3],
      hasPassphrase: parsedCode[4] == 'true' ? true : false
    };

    if (info.type == '1' && info.hasPassphrase)
      this.popupProvider.ionicAlert('Error', 'Password required. Make sure to enter your password in advanced options', 'Ok'); //TODO gettextcatalog

    this.formData.derivationPath = info.derivationPath;
    this.formData.testnetEnabled = info.network == 'testnet' ? true : false;
    this.formData.words = info.data;
  }

  public setDerivationPath(): void {
    this.formData.derivationPath = this.formData.testnet ? this.derivationPathForTestnet : this.derivationPathByDefault;
  }

  private importBlob(str: string, opts: any): void {
    let str2: string;
    let err: any = null;
    try {
      str2 = this.bwcProvider.getSJCL().decrypt(this.formData.filePassword, str);
    } catch (e) {
      err = 'Could not decrypt file, check your password'; //TODO gettextcatalog
      this.logger.warn(e);
    };

    if (err) {
      this.popupProvider.ionicAlert('Error', err, 'Ok'); //TODO gettextcatalog
      return;
    }

    this.onGoingProcessProvider.set('importingWallet', true);
    opts.compressed = null;
    opts.password = null;

    setTimeout(() => {
      this.profileProvider.importWallet(str2, opts).then((wallet: any) => {
        this.onGoingProcessProvider.set('importingWallet', false);
        this.finish(wallet);
      }).catch((err: any) => {
        this.onGoingProcessProvider.set('importingWallet', false);
        this.popupProvider.ionicAlert('Error', err, 'Ok'); //TODO gettextcatalog
        return;
      });
    }, 100);
  }

  private finish(wallet: any): void {
    this.walletProvider.updateRemotePreferences(wallet).then(() => {
      this.profileProvider.setBackupFlag(wallet.credentials.walletId);
      if (this.fromOnboarding) {
        this.profileProvider.setDisclaimerAccepted().catch((err: any) => {
          this.logger.error(err);
        });
      }
      this.navCtrl.setRoot(HomePage);
      this.navCtrl.popToRoot();
    }).catch((err: any) => {
      this.logger.warn(err);
    });
  }

  private importExtendedPrivateKey(xPrivKey, opts) {
    this.onGoingProcessProvider.set('importingWallet', true);
    setTimeout(() => {
      this.profileProvider.importExtendedPrivateKey(xPrivKey, opts).then((wallet: any) => {
        this.onGoingProcessProvider.set('importingWallet', false);
        this.finish(wallet);
      }).catch((err: any) => {
        if (err instanceof this.errors.NOT_AUTHORIZED) {
          this.importErr = true;
        } else {
          this.popupProvider.ionicAlert('Error', err, 'Ok'); // TODO: gettextcatalog
        }
        this.onGoingProcessProvider.set('importingWallet', false);
        return;
      });
    }, 100);
  }

  private importMnemonic(words: string, opts: any): void {
    this.onGoingProcessProvider.set('importingWallet', true);
    setTimeout(() => {
      this.profileProvider.importMnemonic(words, opts).then((wallet: any) => {
        this.onGoingProcessProvider.set('importingWallet', false);
        this.finish(wallet);
      }).catch((err: any) => {
        if (err instanceof this.errors.NOT_AUTHORIZED) {
          this.importErr = true;
        } else {
          this.popupProvider.ionicAlert('Error', err, 'Ok'); // TODO: gettextcatalog
        }
        this.onGoingProcessProvider.set('importingWallet', false);
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
      this.popupProvider.ionicAlert('Error', 'There is an error in the form', 'Ok'); // TODO: gettextcatalog
      return;
    }

    let backupFile = this.file;
    let backupText = this.formData.backupText;

    if (!backupFile && !backupText) {
      this.popupProvider.ionicAlert('Error', 'Please, select your backup file', 'Ok'); // TODO: gettextcatalog
      return;
    }

    if (backupFile) {
      this.reader.readAsBinaryString(backupFile);
    } else {
      let opts: any = {};
      opts.bwsurl = this.formData.bwsurl;
      opts.coin = this.formData.coin;
      this.importBlob(backupText, opts);
    }
  }

  public importFromMnemonic(): void {
    if (!this.importForm.valid) {
      this.popupProvider.ionicAlert('Error', 'There is an error in the form', 'Ok'); // TODO: gettextcatalog
      return;
    }

    let opts: any = {};

    if (this.formData.bwsurl)
      opts.bwsurl = this.formData.bwsurl;

    let pathData: any = this.derivationPathHelperProvider.parse(this.formData.derivationPath);

    if (!pathData) {
      this.popupProvider.ionicAlert('Error', 'Invalid derivation path', 'Ok'); // TODO: gettextcatalog
      return;
    }

    opts.account = pathData.account;
    opts.networkName = pathData.networkName;
    opts.derivationStrategy = pathData.derivationStrategy;
    opts.coin = this.formData.coin;

    let words: string = this.formData.words || null;

    if (!words) {
      this.popupProvider.ionicAlert('Error', 'Please enter the recovery phrase', 'Ok');
      return;
    } else if (words.indexOf('xprv') == 0 || words.indexOf('tprv') == 0) {
      return this.importExtendedPrivateKey(words, opts);
    } else {
      let wordList: Array<any> = words.split(/[\u3000\s]+/);

      if ((wordList.length % 3) != 0) {
        this.popupProvider.ionicAlert('Error', 'Wrong number of recovery words: ' + wordList.length, 'Ok');
        return;
      }
    }

    opts.passphrase = this.formData.passphrase || null;
    this.importMnemonic(words, opts);
  }

  public toggleShowAdvOpts(): void {
    this.showAdvOpts = !this.showAdvOpts;
  }

  public fileChangeEvent($event: any) {
    this.file = $event.target ? $event.target.files[0] : $event.srcElement.files[0];
    this.formData.file = $event.target.value;
    this.getFile();
  }

  private getFile() {
    // If we use onloadend, we need to check the readyState.
    this.reader.onloadend = (evt: any) => {
      if (evt.target.readyState == 2) { // DONE == 2
        let opts: any = {};
        opts.bwsurl = this.formData.bwsurl;
        opts.coin = this.formData.coin;
        this.importBlob(evt.target.result, opts);
      }
    }
  }

}
