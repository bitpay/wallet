import { Component } from "@angular/core";
import { ViewController } from 'ionic-angular';

@Component({
  selector: 'page-backup-warning-modal',
  templateUrl: 'backup-warning-modal.html'
})
export class BackupWarningModalPage {
  constructor(
    private viewCtrl: ViewController
  ) { }

  public close(): void {
    this.viewCtrl.dismiss();
  }
}