import { Component } from "@angular/core";
import { ViewController } from 'ionic-angular';

@Component({
  selector: 'page-backup-ready-modal',
  templateUrl: 'backup-ready-modal.html'
})
export class BackupReadyModalPage {
  constructor(
    private viewCtrl: ViewController
  ) { }

  public close(): void {
    this.viewCtrl.dismiss();
  }
}