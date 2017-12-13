import { Component } from '@angular/core';
import { ModalController } from 'ionic-angular';
import { ConfigProvider } from '../../../providers/config/config';
import { TouchIdProvider } from '../../../providers/touchid/touchid';
import { PinModalPage } from '../../pin/pin';

@Component({
  selector: 'page-lock',
  templateUrl: 'lock.html',
})
export class LockPage {
  public options: Array<{ method: string, enabled: boolean, disabled: boolean }> = [];
  public lockOptions: any;

  constructor(
    private modalCtrl: ModalController,
    private configProvider: ConfigProvider,
    private touchid: TouchIdProvider,
  ) {
    this.checkLockOptions();
  }

  private checkLockOptions() {
    this.lockOptions = this.configProvider.get().lock;
    this.options = [
      {
        method: 'Disabled',
        enabled: this.lockOptions.method == 'Disabled' ? true : false,
        disabled: false
      },
      {
        method: 'PIN',
        enabled: this.lockOptions.method == 'PIN' ? true : false,
        disabled: false
      },
      {
        method: 'Fingerprint',
        enabled: this.lockOptions.method == 'Fingerprint' ? true : false,
        disabled: !this.touchid.isAvailable() ? true : false
      }
    ];
  }

  public select(method): void {
    switch (method) {
      case 'PIN':
        this.openPinModal('pinSetUp');
        break;
      case 'Disabled':
        this.openPinModal('removeLock');
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

  public lockByFingerprint(): void {
    let lock = { method: 'Fingerprint', value: null, bannedUntil: null };
    this.configProvider.set({ lock });
  }
}
