import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController} from 'ionic-angular';

/**
 * Generated class for the BackupRequestPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-backup-request',
  templateUrl: 'backup-request.html',
})
export class BackupRequestPage {
  private opts: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, public alertCtrl: AlertController) {
    this.opts = {
      title: '',
      message: '',
      buttons: [],
    }
  }

  ionViewDidLoad() {
  }

  initBackupFlow() {
    // TODO navigate to backup flow
    this.navCtrl.push('BackupWarningPage');
  }

  later(confirmed: boolean) {
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
              this.later(true);
            }, 300);
          } else {
            this.navCtrl.push('DisclaimerPage');
          }
        }
      }]
    let alert = this.alertCtrl.create(this.opts);
    alert.present();
  }

}
