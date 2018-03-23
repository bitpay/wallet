import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController } from 'ionic-angular';

// pages
import { PinModalPage } from '../../pin/pin';

// providers
import { ConfigProvider } from '../../../providers/config/config';
import { ProfileProvider } from '../../../providers/profile/profile';
import { TouchIdProvider } from '../../../providers/touchid/touchid';

import * as _ from 'lodash';

@Component({
  selector: 'page-lock',
  templateUrl: 'lock.html',
})
export class LockPage {

  public options: Array<{ label: string, method: string, enabled: boolean, disabled: boolean }> = [];
  public lockOptions: any;
  public needsBackupMsg: string;

  constructor(
    private modalCtrl: ModalController,
    private configProvider: ConfigProvider,
    private touchIdProvider: TouchIdProvider,
    private profileProvider: ProfileProvider,
    private translate: TranslateService
  ) {
    this.checkLockOptions();
  }

  private checkLockOptions() {
    this.lockOptions = this.configProvider.get().lock;
    this.touchIdProvider.isAvailable().then((isAvailable: boolean) => {
      let needsBackup = this.needsBackup();
      this.options = [
        {
          label: this.translate.instant('Disabled'),
          method: 'Disabled',
          enabled: !this.lockOptions.method || this.lockOptions.method == 'Disabled' ? true : false,
          disabled: false
        },
        {
          label: this.translate.instant('PIN'),
          method: 'PIN',
          enabled: this.lockOptions.method == 'PIN' ? true : false,
          disabled: needsBackup || this.lockOptions.method == 'Fingerprint'
        },
        {
          label: this.translate.instant('Fingerprint'),
          method: 'Fingerprint',
          enabled: this.lockOptions.method == 'Fingerprint' ? true : false,
          disabled: !isAvailable || needsBackup || this.lockOptions.method == 'PIN'
        }
      ];
    });
  }

  public select(method): void {
    switch (method) {
      case 'PIN':
        this.openPinModal('pinSetUp');
        break;
      case 'Disabled':
        if (this.lockOptions.method && this.lockOptions.method == 'PIN') this.openPinModal('removeLock');
        if (this.lockOptions.method && this.lockOptions.method == 'Fingerprint') this.removeFingerprint();
        break;
      case 'Fingerprint':
        this.lockByFingerprint();
        break;
    }
  }

  private openPinModal(action): void {
    let modal = this.modalCtrl.create(PinModalPage, { action });
    modal.present();
    modal.onDidDismiss(() => {
      this.checkLockOptions();
    });
  }

  private removeFingerprint(): void {
    this.touchIdProvider.check().then(() => {
      let lock = { method: 'Disabled', value: null, bannedUntil: null };
      this.configProvider.set({ lock });
      this.checkLockOptions();
    }).catch(() => {
      this.checkLockOptions();
    });
  }

  public lockByFingerprint(): void {
    let lock = { method: 'Fingerprint', value: null, bannedUntil: null };
    this.configProvider.set({ lock });
    this.checkLockOptions();
  }

  private needsBackup() {
    let wallets = this.profileProvider.getWallets();
    let singleLivenetWallet = wallets.length == 1 && wallets[0].network == 'livenet' && wallets[0].needsBackup;
    let atLeastOneLivenetWallet = _.find(wallets, (w) => {
      return w.network == 'livenet' && w.needsBackup;
    });

    if (singleLivenetWallet) {
      this.needsBackupMsg = this.translate.instant('Backup your wallet before using this function');
      return true;
    } else if (atLeastOneLivenetWallet) {
      this.needsBackupMsg = this.translate.instant('Backup all your wallets before using this function');
      return true;
    } else {
      this.needsBackupMsg = null;
      return false;
    }
  };
}
