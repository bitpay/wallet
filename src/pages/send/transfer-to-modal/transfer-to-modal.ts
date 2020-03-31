import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

@Component({
  selector: 'page-transfer-to-modal',
  templateUrl: 'transfer-to-modal.html'
})
export class TransferToModalPage {
  public search: string = '';
  public wallet;
  public fromSelectInputs: boolean;

  constructor(private navParams: NavParams) {
    this.wallet = this.navParams.data.wallet;
    this.fromSelectInputs = this.navParams.data.fromSelectInputs;
  }
}
