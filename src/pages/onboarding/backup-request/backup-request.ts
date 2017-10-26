import { Component } from '@angular/core';
import { NavController, NavParams, AlertController} from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

import { DisclaimerPage } from '../disclaimer/disclaimer';
import { BackupWarningPage } from '../../backup/backup-warning/backup-warning';

@Component({
  selector: 'page-backup-request',
  templateUrl: 'backup-request.html',
})
export class BackupRequestPage {
  private opts: any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    private log: Logger
  ) {
    this.opts = {
      title: '',
      message: '',
      buttons: [],
    }
  }

  ionViewDidLoad() {
    this.log.info('ionViewDidLoad BackupRequestPage');
  }

  initBackupFlow() {
    this.navCtrl.push(BackupWarningPage);
  }

  doBackupLater(confirmed: boolean) {
    this.opts.title = !confirmed ? '¡Watch Out!' : 'Are you sure you want to skip it?';
    this.opts.message = !confirmed ? 'If this device is replaced or this app is deleted, neither you nor BitPay can recover your funds without a backup.' : 'You can create a backup later from your wallet settings.';
    this.opts.buttons = [{
      text: 'Go back',
      role: 'destructor'
    },
      {
        text: !confirmed ? 'I understand' : 'Yes, skip',
        handler: () => {
          if (!confirmed) {
            setTimeout(() => {
              this.doBackupLater(true);
            }, 300);
          } else {
            this.navCtrl.push(DisclaimerPage);
          }
        }
      }]
    let alert = this.alertCtrl.create(this.opts);
    alert.present();
  }

}
