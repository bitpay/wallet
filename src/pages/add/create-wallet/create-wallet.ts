import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  NavParams
} from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// Pages
import { FinishModalPage } from '../../finish/finish';

// Providers
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { ConfigProvider } from '../../../providers/config/config';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';
import {
  WalletOptions,
  WalletProvider
} from '../../../providers/wallet/wallet';

import * as _ from 'lodash';

@Component({
  selector: 'page-create-wallet',
  templateUrl: 'create-wallet.html'
})
export class CreateWalletPage implements OnInit {
  /* For compressed keys, m*73 + n*34 <= 496 */
  private COPAYER_PAIR_LIMITS = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 4,
    6: 4,
    7: 3,
    8: 3,
    9: 2,
    10: 2,
    11: 1,
    12: 1
  };

  private defaults;
  private tc: number;

  public copayers: number[];
  public signatures: number[];
  public showAdvOpts: boolean;
  public isShared: boolean;
  public coin: string;
  public okText: string;
  public cancelText: string;
  public createForm: FormGroup;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private fb: FormBuilder,
    private profileProvider: ProfileProvider,
    private configProvider: ConfigProvider,
    private popupProvider: PopupProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private logger: Logger,
    private walletProvider: WalletProvider,
    private translate: TranslateService,
    private events: Events,
    private pushNotificationsProvider: PushNotificationsProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private modalCtrl: ModalController
  ) {
    this.okText = this.translate.instant('Ok');
    this.cancelText = this.translate.instant('Cancel');
    this.isShared = this.navParams.get('isShared');
    this.coin = this.navParams.get('coin');
    this.defaults = this.configProvider.getDefaults();
    this.tc = this.isShared ? this.defaults.wallet.totalCopayers : 1;
    this.copayers = _.range(2, this.defaults.limits.totalCopayers + 1);
    this.showAdvOpts = false;

    this.createForm = this.fb.group({
      walletName: [null, Validators.required],
      myName: [null],
      totalCopayers: [1],
      requiredCopayers: [1],
      bwsURL: [this.defaults.bws.url],
      recoveryPhrase: [null],
      testnetEnabled: [false],
      singleAddress: [false],
      coin: [this.coin, Validators.required]
    });

    this.setTotalCopayers(this.tc);
    this.updateRCSelect(this.tc);
  }

  ngOnInit() {
    if (this.isShared) {
      this.createForm.get('myName').setValidators([Validators.required]);
    }
  }

  public setTotalCopayers(n: number): void {
    this.createForm.controls['totalCopayers'].setValue(n);
    this.updateRCSelect(n);
  }

  private updateRCSelect(n: number): void {
    this.createForm.controls['totalCopayers'].setValue(n);
    const maxReq = this.COPAYER_PAIR_LIMITS[n];
    this.signatures = _.range(1, maxReq + 1);
    this.createForm.controls['requiredCopayers'].setValue(
      Math.min(Math.trunc(n / 2 + 1), maxReq)
    );
  }

  public setOptsAndCreate(): void {
    const opts: Partial<WalletOptions> = {
      name: this.createForm.value.walletName,
      m: this.createForm.value.requiredCopayers,
      n: this.createForm.value.totalCopayers,
      myName:
        this.createForm.value.totalCopayers > 1
          ? this.createForm.value.myName
          : null,
      networkName: this.createForm.value.testnetEnabled ? 'testnet' : 'livenet',
      bwsurl: this.createForm.value.bwsURL,
      singleAddress: this.createForm.value.singleAddress,
      coin: this.createForm.value.coin
    };
    this.create(opts);
  }

  private create(opts): void {
    this.onGoingProcessProvider.set('creatingWallet');
    this.profileProvider
      .createWalletInVault(opts)
      .then(wallet => {
        this.onGoingProcessProvider.clear();
        this.events.publish('status:updated');
        this.walletProvider.updateRemotePreferences(wallet);
        this.pushNotificationsProvider.updateSubscription(wallet);
        this.setBackupFlag(wallet.credentials.walletId);
        this.setFingerprint(wallet.credentials.walletId);
        this.showFinishModalPage();
        this.navCtrl.popToRoot();
        this.events.publish('OpenWallet', wallet);
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        if (
          err &&
          err.message != 'FINGERPRINT_CANCELLED' &&
          err.message != 'PASSWORD_CANCELLED'
        ) {
          this.logger.error('Create: could not create wallet', err);
          const title = this.translate.instant('Error');
          err = this.bwcErrorProvider.msg(err);
          this.popupProvider.ionicAlert(title, err);
        }
        return;
      });
  }

  private async showFinishModalPage() {
    this.onGoingProcessProvider.clear();
    const finishText = this.translate.instant('Wallet Created');
    const finishComment = '';
    const cssClass = 'primary';
    const params = { finishText, finishComment, cssClass };
    const modal = this.modalCtrl.create(FinishModalPage, params, {
      showBackdrop: true,
      enableBackdropDismiss: false,
      cssClass: 'finish-modal'
    });
    modal.present();
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

  public openSupportSingleAddress(): void {
    const url =
      'https://support.bitpay.com/hc/en-us/articles/360015920572-Setting-up-the-Single-Address-Feature-for-your-BitPay-Wallet';
    const optIn = true;
    const title = null;
    const message = this.translate.instant('Read more in our support page');
    const okText = this.translate.instant('Open');
    const cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }
}
