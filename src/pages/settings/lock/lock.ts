import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController } from 'ionic-angular';

// pages
import { PinModalPage } from '../../pin/pin-modal/pin-modal';

// providers
import { ConfigProvider } from '../../../providers/config/config';
import { ProfileProvider } from '../../../providers/profile/profile';
import { TouchIdProvider } from '../../../providers/touchid/touchid';

import * as _ from 'lodash';

@Component({
  selector: 'page-lock',
  templateUrl: 'lock.html'
})
export class LockPage {
  public options: Array<{
    label: string;
    method: string;
    enabled: boolean;
    disabled: boolean;
  }> = [];
  public lockOptions;
  public needsBackupMsg: string;

  constructor(
    private configProvider: ConfigProvider,
    private modalCtrl: ModalController,
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
          method: 'disabled',
          enabled:
            !this.lockOptions.method ||
            (this.lockOptions.method &&
            this.lockOptions.method.toLowerCase() == 'disabled'
              ? true
              : false),
          disabled: false
        },
        {
          label: this.translate.instant('PIN'),
          method: 'pin',
          enabled:
            this.lockOptions.method &&
            this.lockOptions.method.toLowerCase() == 'pin'
              ? true
              : false,
          disabled: needsBackup
        },
        {
          label: this.translate.instant('Biometric'),
          method: 'fingerprint',
          enabled:
            this.lockOptions.method &&
            this.lockOptions.method.toLowerCase() == 'fingerprint'
              ? true
              : false,
          disabled: !isAvailable || needsBackup
        }
      ];
    });
  }

  public select(method): void {
    switch (method) {
      case 'disabled':
        this.removeLockMethod();
        break;
      case 'pin':
        this.openPinModal('pinSetUp');
        break;
      case 'fingerprint':
        this.lockByFingerprint();
        break;
    }
  }

  private removeLockMethod(): void {
    let lock = { method: 'disabled', value: null, bannedUntil: null };
    this.configProvider.set({ lock });
    this.checkLockOptions();
  }

  private openPinModal(action): void {
    const modal = this.modalCtrl.create(
      PinModalPage,
      { action },
      { cssClass: 'fullscreen-modal' }
    );
    modal.present();
    modal.onDidDismiss(() => {
      this.checkLockOptions();
    });
  }

  public lockByFingerprint(): void {
    let lock = { method: 'fingerprint', value: null, bannedUntil: null };
    this.configProvider.set({ lock });
    this.checkLockOptions();
  }

  private needsBackup() {
    let wallets = this.profileProvider.getWallets();
    let singleLivenetWallet =
      wallets.length == 1 &&
      wallets[0].network == 'livenet' &&
      wallets[0].needsBackup;
    let atLeastOneLivenetWallet = _.find(wallets, w => {
      return w.network == 'livenet' && w.needsBackup;
    });

    if (singleLivenetWallet) {
      this.needsBackupMsg = this.translate.instant(
        'Back up your wallet before using this function'
      );
      return true;
    } else if (atLeastOneLivenetWallet) {
      this.needsBackupMsg = this.translate.instant(
        'Back up all your wallets before using this function'
      );
      return true;
    } else {
      this.needsBackupMsg = null;
      return false;
    }
  }
}
