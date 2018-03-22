import { Component } from "@angular/core";
import { ViewController } from 'ionic-angular';

@Component({
  selector: 'page-backup-needed-modal',
  templateUrl: 'backup-needed-modal.html'
})
export class BackupNeededModalPage {
  constructor(
    private viewCtrl: ViewController
  ) { }

  public close(): void {
    this.viewCtrl.dismiss();
  }
}