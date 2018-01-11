import { Component } from '@angular/core';
import { ModalController } from 'ionic-angular';

//pages
import { PinModalPage } from '../../pin/pin';

//providers
import { ConfigProvider } from '../../../providers/config/config';
import { TouchIdProvider } from '../../../providers/touchid/touchid';
import { ProfileProvider } from '../../../providers/profile/profile';

import * as _ from 'lodash';

@Component({
  selector: 'page-lock',
  templateUrl: 'lock.html',
})
export class LockPage {

  public options: Array<{ method: string, enabled: boolean, disabled: boolean }> = [];
  public lockOptions: any;
  public needsBackupMsg: string;

  constructor(
    private modalCtrl: ModalController,
    private configProvider: ConfigProvider,
    private touchIdProvider: TouchIdProvider,
    private profileProvider: ProfileProvider
  ) {
    this.checkLockOptions();
  }

  private checkLockOptions() {
    this.lockOptions = this.configProvider.get().lock;
    this.touchIdProvider.isAvailable().then((isAvailable: boolean) => {
      let needsBackup = this.needsBackup();
      this.options = [
        {
          method: 'Disabled',
          enabled: !this.lockOptions.method || this.lockOptions.method == 'Disabled' ? true : false,
          disabled: false
        },
        {
          method: 'PIN',
          enabled: this.lockOptions.method == 'PIN' ? true : false,
          disabled: needsBackup
        },
        {
          method: 'Fingerprint',
          enabled: this.lockOptions.method == 'Fingerprint' ? true : false,
          disabled: !isAvailable || needsBackup
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
    });
  }

  public lockByFingerprint(): void {
    let lock = { method: 'Fingerprint', value: null, bannedUntil: null };
    this.configProvider.set({ lock });
  }

  private needsBackup() {
    let wallets = this.profileProvider.getWallets();
    let singleLivenetWallet = wallets.length == 1 && wallets[0].network == 'livenet' && wallets[0].needsBackup;
    let atLeastOneLivenetWallet = _.find(wallets, (w) => {
      return w.network == 'livenet' && w.needsBackup;
    });

    if (singleLivenetWallet) {
      this.needsBackupMsg = 'Backup your wallet before using this function'; //TODO gettextCatalog
      return true;
    } else if (atLeastOneLivenetWallet) {
      this.needsBackupMsg = 'Backup all your wallets before using this function'; //TODO gettextCatalog
      return true;
    } else {
      this.needsBackupMsg = null;
      return false;
    }
  };
}
