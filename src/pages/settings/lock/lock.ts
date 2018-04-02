import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'ionic-angular';

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
    private configProvider: ConfigProvider,
    private touchIdProvider: TouchIdProvider,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    private events: Events
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
          enabled: !this.lockOptions.method || this.lockOptions.method.toLowerCase() == 'disabled' ? true : false,
          disabled: false
        },
        {
          label: this.translate.instant('PIN'),
          method: 'pin',
          enabled: this.lockOptions.method && this.lockOptions.method.toLowerCase() == 'pin' ? true : false,
          disabled: needsBackup || this.lockOptions.method.toLowerCase() == 'fingerprint'
        },
        {
          label: this.translate.instant('Fingerprint'),
          method: 'fingerprint',
          enabled: this.lockOptions.method && this.lockOptions.method.toLowerCase() == 'fingerprint' ? true : false,
          disabled: !isAvailable || needsBackup || this.lockOptions.method.toLowerCase() == 'pin'
        }
      ];
    });
  }

  public select(method): void {
    switch (method) {
      case 'pin':
        this.openPinModal('pinSetUp');
        break;
      case 'disabled':
        if (this.lockOptions.method && this.lockOptions.method.toLowerCase() == 'pin') this.openPinModal('removeLock');
        if (this.lockOptions.method && this.lockOptions.method.toLowerCase() == 'fingerprint') this.removeFingerprint();
        break;
      case 'fingerprint':
        this.lockByFingerprint();
        break;
    }
  }

  private openPinModal(action): void {
    this.events.publish('showPinModalEvent', action);
    this.events.subscribe('finishPinModalEvent', (wallet: any) => {
      this.checkLockOptions();
      this.events.unsubscribe('finishPinModalEvent');
    });
  }

  private removeFingerprint(): void {
    this.touchIdProvider.check().then(() => {
      let lock = { method: 'disabled', value: null, bannedUntil: null };
      this.configProvider.set({ lock });
      this.checkLockOptions();
    }).catch(() => {
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
