import { Component } from '@angular/core';
import { NavController, ViewController } from 'ionic-angular';
import { TabsPage } from '../../tabs/tabs';

@Component({
  selector: 'page-backup-confirm-modal',
  templateUrl: 'backup-confirm-modal.html',
})
export class BackupConfirmModalPage {

  constructor(
    public navCtrl: NavController,
    public viewCtrl: ViewController
  ) {}

  closeBackupResultModal() {
    // TODO Set disclaimer accepted
    this.viewCtrl.dismiss();
    this.navCtrl.setRoot(TabsPage);
    this.navCtrl.popToRoot();
  }

}
