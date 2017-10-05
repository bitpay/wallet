import { Component } from '@angular/core';
import { NavController, NavParams, ModalController } from 'ionic-angular';
import { ConfigProvider } from '../../../providers/config/config';

import { PinModalPage } from '../../pin/pin';

@Component({
  selector: 'page-lock',
  templateUrl: 'lock.html',
})
export class LockPage {
  public options: Array<{ method: string, enabled: boolean }> = [];
  public lockOptions: Object;

  constructor(
    private modalCtrl: ModalController,
    private config: ConfigProvider
  ) {

    this.lockOptions = this.config.get()['lock'];
    this.options = [
      {
        method: 'Disabled',
        enabled: this.lockOptions['method'] == 'Disabled' ? true : false
      },
      {
        method: 'PIN',
        enabled: this.lockOptions['method'] == 'PIN' ? true : false
      },
    ];
  }

  select(method): void {
    switch (method) {
      case 'PIN':
        this.openPinModal('pinSetUp');
        break;
      case 'Disabled':
        this.openPinModal('removeLock');
    }
  }

  openPinModal(action) {
    let modal = this.modalCtrl.create(PinModalPage, { action });
    modal.present();
  }
}
