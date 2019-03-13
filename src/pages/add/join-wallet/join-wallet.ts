import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { App, Events, NavController, NavParams } from 'ionic-angular';

// Pages
import { ScanPage } from '../../scan/scan';
import { TabsPage } from '../../tabs/tabs';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ClipboardProvider } from '../../../providers/clipboard/clipboard';
import { ConfigProvider } from '../../../providers/config/config';
import { Logger } from '../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';
import {
  Coin,
  WalletOptions,
  WalletProvider
} from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-join-wallet',
  templateUrl: 'join-wallet.html'
})
export class JoinWalletPage {
  private defaults;
  public showAdvOpts: boolean;
  public seedOptions;
  public joinForm: FormGroup;

  private regex: RegExp;
  private coin: Coin;
  private network: string;

  constructor(
    private app: App,
    private bwcProvider: BwcProvider,
    private configProvider: ConfigProvider,
    private form: FormBuilder,
    private navParams: NavParams,
    private navCtrl: NavController,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private logger: Logger,
    private translate: TranslateService,
    private events: Events,
    private pushNotificationsProvider: PushNotificationsProvider,
    private actionSheetProvider: ActionSheetProvider,
    private clipboardProvider: ClipboardProvider,
    private bwcErrorProvider: BwcErrorProvider
  ) {
    this.defaults = this.configProvider.getDefaults();
    this.showAdvOpts = false;

    this.regex = /^[0-9A-HJ-NP-Za-km-z]{70,80}$/; // For invitationCode
    this.joinForm = this.form.group({
      myName: [null, Validators.required],
      invitationCode: [
        null,
        [Validators.required, Validators.pattern(this.regex)]
      ], // invitationCode == secret
      bwsURL: [this.defaults.bws.url]
    });

    this.events.subscribe(
      'update:invitationCode',
      this.updateInvitationCodeHandler
    );
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: JoinWalletPage');
  }

  ionViewWillEnter() {
    if (this.navParams.data.url) {
      let data: string = this.navParams.data.url;
      data = data.replace('copay:', '');
      this.onQrCodeScannedJoin(data);
    }
  }

  ngOnDestroy() {
    this.events.unsubscribe(
      'update:invitationCode',
      this.updateInvitationCodeHandler
    );
  }

  private updateInvitationCodeHandler: any = data => {
    const invitationCode = data.value.replace('copay:', '');
    this.onQrCodeScannedJoin(invitationCode);
  };

  public onQrCodeScannedJoin(data: string): void {
    if (this.regex.test(data)) {
      this.joinForm.controls['invitationCode'].setValue(data);
    } else {
      const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
        'default-error',
        {
          msg: this.translate.instant('Invalid data'),
          title: this.translate.instant('Error')
        }
      );
      errorInfoSheet.present();
    }
  }

  public processInvitation(invitation: string): void {
    if (this.regex.test(invitation)) {
      this.logger.info('Processing invitation code...');
      let walletData;
      try {
        walletData = this.bwcProvider.parseSecret(invitation);
        this.coin = walletData.coin;
        this.network = walletData.network;
        this.logger.info('Correct invitation code for ' + walletData.network);
      } catch (ex) {
        this.logger.warn('Error parsing invitation: ' + ex);
      }
    }
  }

  public setOptsAndJoin(): void {
    const opts: Partial<WalletOptions> = {
      secret: this.joinForm.value.invitationCode,
      myName: this.joinForm.value.myName,
      bwsurl: this.joinForm.value.bwsURL,
      coin: this.coin,
      networkName: this.network
    };

    this.join(opts);
  }

  private join(opts): void {
    this.onGoingProcessProvider.set('joiningWallet');

    this.profileProvider
      .joinWalletInVault(opts)
      .then(wallet => {
        this.onGoingProcessProvider.clear();
        this.clipboardProvider.clearClipboardIfValidData(['JoinWallet']);
        this.events.publish('status:updated');
        this.walletProvider.updateRemotePreferences(wallet);
        this.pushNotificationsProvider.updateSubscription(wallet);
        this.setBackupFlag(wallet.credentials.walletId);
        this.setFingerprint(wallet.credentials.walletId);
        this.app
          .getRootNavs()[0]
          .setRoot(TabsPage)
          .then(() => {
            this.events.publish('OpenWallet', wallet);
          });
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        if (
          err &&
          err.message != 'FINGERPRINT_CANCELLED' &&
          err.message != 'PASSWORD_CANCELLED'
        ) {
          this.logger.error('Join: could not join wallet', err);
          const title = this.translate.instant('Error');
          err = this.bwcErrorProvider.msg(err);
          this.popupProvider.ionicAlert(title, err);
        }
        return;
      });
  }

  private setBackupFlag(walletId: string) {
    const vault = this.profileProvider.activeVault;
    if (!vault.needsBackup) this.profileProvider.setBackupFlag(walletId);
  }

  private async setFingerprint(walletId: string) {
    const vaultWallets = this.profileProvider.getVaultWallets();
    const config = this.configProvider.get();
    const touchIdEnabled = config.touchIdFor
      ? config.touchIdFor[vaultWallets[0].credentials.walletId]
      : null;

    if (!touchIdEnabled) return;

    const opts = {
      touchIdFor: {}
    };
    opts.touchIdFor[walletId] = true;
    this.configProvider.set(opts);
  }

  public openScanner(): void {
    this.navCtrl.push(ScanPage, { fromJoin: true });
  }
}
