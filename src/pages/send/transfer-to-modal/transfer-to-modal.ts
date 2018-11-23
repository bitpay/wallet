import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

@Component({
  selector: 'page-transfer-to-modal',
  templateUrl: 'transfer-to-modal.html'
})
export class TransferToModalPage {
  public search: string = '';
  public wallet;

  constructor(private navParams: NavParams, private viewCtrl: ViewController) {
    this.wallet = this.navParams.data.wallet;
  }

  public close(): void {
    this.viewCtrl.dismiss();
  }
}
