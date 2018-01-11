import { Component } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';

//native
import { SocialSharing } from '@ionic-native/social-sharing';
import { Clipboard } from '@ionic-native/clipboard';

//providers
import { ProfileProvider } from '../../../../../providers/profile/profile';
import { WalletProvider } from '../../../../../providers/wallet/wallet';
import { PopupProvider } from '../../../../../providers/popup/popup';
import { PersistenceProvider } from '../../../../../providers/persistence/persistence';
import { BackupProvider } from '../../../../../providers/backup/backup';
import { PlatformProvider } from '../../../../../providers/platform/platform';
import { AppProvider } from '../../../../../providers/app/app';

//pages
import { SettingsPage } from '../../../../../pages/settings/settings';

@Component({
  selector: 'page-wallet-export',
  templateUrl: 'wallet-export.html',
})
export class WalletExportPage {

  public wallet: any;
  public segments: string = 'file/text';
  public password: string = '';
  public result: string = '';
  public exportWalletForm: FormGroup;
  public showAdv: boolean = false;
  public isEncrypted: boolean;
  public showAdvanced: boolean = false;
  public canSign: boolean;
  public backupWalletPlainText: any;
  public isCordova: boolean;
  public isSafari: boolean;
  public exportWalletInfo: any;
  public supported: boolean;

  constructor(
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private formBuilder: FormBuilder,
    private popupProvider: PopupProvider,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private backupProvider: BackupProvider,
    private platformProvider: PlatformProvider,
    private socialSharing: SocialSharing,
    private appProvider: AppProvider,
    private clipboard: Clipboard,
    public toastCtrl: ToastController
  ) {
    this.exportWalletForm = this.formBuilder.group({
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      noSignEnabled: [false]
    }, { validator: this.matchingPasswords('password', 'confirmPassword') });
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad WalletExportPage');
  }

  ionViewWillEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.isEncrypted = this.wallet.isPrivKeyEncrypted();
    this.canSign = this.wallet.canSign();
    this.isCordova = this.platformProvider.isCordova;
    this.isSafari = this.platformProvider.isSafari;
  }

  private matchingPasswords(passwordKey: string, confirmPasswordKey: string) {
    return (group: FormGroup): { [key: string]: any } => {
      let password = group.controls[passwordKey];
      let confirmPassword = group.controls[confirmPasswordKey];
      if (password.value !== confirmPassword.value) {
        return {
          mismatchedPasswords: true
        };
      }
    }
  }

  public showAdvChange(): void {
    this.showAdv = !this.showAdv;
  };

  public getPassword(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.password) return resolve(this.password);

      this.walletProvider.prepare(this.wallet).then((password) => {
        this.password = password;
        return resolve(password);
      }).catch((err: any) => {
        return reject(err);
      });
    })
  };

  public generateQrCode() {
    if (this.exportWalletInfo || !this.isEncrypted) {
      this.segments = 'qrCode';
    }

    this.getPassword().then((password: string) => {

      this.walletProvider.getEncodedWalletInfo(this.wallet, password).then((code) => {

        if (!code)
          this.supported = false;
        else {
          this.supported = true;
          this.exportWalletInfo = code;
        }

        this.segments = 'qrCode';
      }).catch((err: string) => {
        this.popupProvider.ionicAlert('Error', err);  //TODO gettextcatalog
      });
    }).catch((err: string) => {
      this.popupProvider.ionicAlert('Error', err); //TODO gettextcatalog
    });
  };

  /*
    EXPORT WITHOUT PRIVATE KEY - PENDING
  */

  public noSignEnabledChange(): void {
    if (!this.supported) return;

    this.walletProvider.getEncodedWalletInfo(this.wallet).then((code: string) => {
      this.supported = true;
      this.exportWalletInfo = code;
    }).catch((err) => {
      this.logger.error(err);
      this.supported = false;
      this.exportWalletInfo = null;
    });
  };

  public downloadWalletBackup(): void {
    this.getPassword().then((password: string) => {
      this.getAddressbook().then((localAddressBook: any) => {
        let opts = {
          noSign: this.exportWalletForm.value.noSignEnabled,
          addressBook: localAddressBook,
          password: password
        };

        this.backupProvider.walletDownload(this.exportWalletForm.value.password, opts, this.navParams.data.walletId).then(() => {
          this.navCtrl.setRoot(SettingsPage);
          this.navCtrl.popToRoot();
          this.navCtrl.parent.select(0);
        }).catch((err: string) => {
          this.popupProvider.ionicAlert('Error', 'Failed to export');  //TODO gettextcatalog
        });
      }).catch(() => {
        this.popupProvider.ionicAlert('Error', 'Failed to export');  //TODO gettextcatalog
      });
    }).catch((err: string) => {
      this.popupProvider.ionicAlert('Error', err);
    });
  }

  public getAddressbook(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider.getAddressbook(this.wallet.credentials.network).then((addressBook: any) => {
        let localAddressBook = [];
        try {
          localAddressBook = JSON.parse(addressBook);
        } catch (ex) {
          this.logger.warn(ex);
        }

        return resolve(localAddressBook);
      }).catch((err) => {
        return reject(err);
      });
    });
  }

  private getBackup(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getPassword().then((password: string) => {
        this.getAddressbook().then((localAddressBook: any) => {
          let opts = {
            noSign: this.exportWalletForm.value.noSignEnabled,
            addressBook: localAddressBook,
            password: password
          };

          var ew = this.backupProvider.walletExport(this.exportWalletForm.value.password, opts, this.navParams.data.walletId);
          if (!ew) {
            this.popupProvider.ionicAlert('Error', 'Failed to export'); //TODO gettextcatalog
          }
          return resolve(ew);
        }).catch((err: string) => {
          this.popupProvider.ionicAlert('Error', 'Failed to export');  //TODO gettextcatalog
          return resolve();
        });
      }).catch((err: string) => {
        this.popupProvider.ionicAlert('Error', err);  //TODO gettextcatalog
        return resolve();
      });;
    });
  }

  public viewWalletBackup(): void {
    this.getBackup().then((backup: any) => {
      var ew = backup;
      if (!ew) return;
      this.backupWalletPlainText = ew;
    });
  };

  public copyWalletBackup(): void {
    this.getBackup().then((backup: any) => {
      var ew = backup;
      if (!ew) return;
      this.clipboard.copy(ew);
      let showSuccess = this.toastCtrl.create({
        message: 'Copied to clipboard',
        duration: 1000,
      });
      showSuccess.present();
    });
  };

  public sendWalletBackup(): void {
    let showSuccess = this.toastCtrl.create({
      message: 'Preparing backup...',
      duration: 1000,
    });
    showSuccess.present();
    let name = (this.wallet.credentials.walletName || this.wallet.credentials.walletId);
    if (this.wallet.alias) {
      name = this.wallet.alias + ' [' + name + ']';
    }
    this.getBackup().then((backup) => {
      let ew = backup;
      if (!ew) return;

      if (this.exportWalletForm.value.noSignEnabled)
        name = name + '(No Private Key)';

      let subject = this.appProvider.info.nameCase + ' Wallet Backup: ' + name;
      let body = 'Here is the encrypted backup of the wallet ' + name + ': \n\n' + ew + '\n\n To import this backup, copy all text between {...}, including the symbols {}';
      this.socialSharing.shareViaEmail(
        body,
        subject,
        null, // TO: must be null or an array
        null, // CC: must be null or an array
        null, // BCC: must be null or an array
        null, // FILES: can be null, a string, or an array
      );
    });
  };

}