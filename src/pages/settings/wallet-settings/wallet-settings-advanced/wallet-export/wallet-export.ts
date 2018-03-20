import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { Logger } from '../../../../../providers/logger/logger';

// native
import { Clipboard } from '@ionic-native/clipboard';
import { SocialSharing } from '@ionic-native/social-sharing';

// providers
import { AppProvider } from '../../../../../providers/app/app';
import { BackupProvider } from '../../../../../providers/backup/backup';
import { PersistenceProvider } from '../../../../../providers/persistence/persistence';
import { PlatformProvider } from '../../../../../providers/platform/platform';
import { PopupProvider } from '../../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../../providers/profile/profile';
import { WalletProvider } from '../../../../../providers/wallet/wallet';

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
  public isIOS: boolean;
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
    public toastCtrl: ToastController,
    private translate: TranslateService
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
    this.isIOS = this.platformProvider.isIOS;
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
      this.segments = 'qr-code';
    }

    this.getPassword().then((password: string) => {

      this.walletProvider.getEncodedWalletInfo(this.wallet, password).then((code) => {

        if (!code)
          this.supported = false;
        else {
          this.supported = true;
          this.exportWalletInfo = code;
        }

        this.segments = 'qr-code';
      }).catch((err: string) => {
        this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
      });
    }).catch((err: string) => {
      this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
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
          password
        };

        this.backupProvider.walletDownload(this.exportWalletForm.value.password, opts, this.navParams.data.walletId).then(() => {
          this.navCtrl.popToRoot({ animate: false }).then(() => {
            this.navCtrl.parent.select(0);
          });
        }).catch((err: string) => {
          this.popupProvider.ionicAlert(this.translate.instant('Error'), this.translate.instant('Failed to export'));
        });
      }).catch(() => {
        this.popupProvider.ionicAlert(this.translate.instant('Error'), this.translate.instant('Failed to export'));
      });
    }).catch((err: string) => {
      this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
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
            password
          };

          var ew = this.backupProvider.walletExport(this.exportWalletForm.value.password, opts, this.navParams.data.walletId);
          if (!ew) {
            this.popupProvider.ionicAlert(this.translate.instant('Error'), this.translate.instant('Failed to export'));
          }
          return resolve(ew);
        }).catch((err: string) => {
          this.popupProvider.ionicAlert(this.translate.instant('Error'), this.translate.instant('Failed to export'));
          return resolve();
        });
      }).catch((err: string) => {
        this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
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
      let copyMessage = this.translate.instant('Copied to clipboard');
      let showSuccess = this.toastCtrl.create({
        message: copyMessage,
        duration: 1000,
      });
      showSuccess.present();
    });
  };

  public sendWalletBackup(): void {
    let preparingMessage = this.translate.instant('Preparing backup...');
    let showSuccess = this.toastCtrl.create({
      message: preparingMessage,
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