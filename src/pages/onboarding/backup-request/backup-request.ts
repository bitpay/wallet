import { Component } from '@angular/core';
import { AlertController, NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// Pages
import { BackupWarningPage } from '../../backup/backup-warning/backup-warning';
import { DisclaimerPage } from '../disclaimer/disclaimer';

@Component({
  selector: 'page-backup-request',
  templateUrl: 'backup-request.html',
})
export class BackupRequestPage {
  private opts: any;
  private walletId: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    private log: Logger
  ) {
    this.walletId = this.navParams.get('walletId');
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
    this.navCtrl.push(BackupWarningPage, { walletId: this.walletId, fromOnboarding: true });
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
