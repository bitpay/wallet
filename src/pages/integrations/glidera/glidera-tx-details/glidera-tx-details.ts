import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

@Component({
  selector: 'page-glidera-tx-details',
  templateUrl: 'glidera-tx-details.html'
})
export class GlideraTxDetailsPage {
  public tx: any;

  constructor(private navParams: NavParams, private viewCtrl: ViewController) {
    this.tx = this.navParams.data.tx;
  }

  public close(): void {
    this.viewCtrl.dismiss();
  }
}
