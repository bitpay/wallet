import { Component } from '@angular/core';
import { NavController, NavParams, ModalController, ViewController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

@Component({
  selector: 'page-glidera-tx-details',
  templateUrl: 'glidera-tx-details.html',
})
export class GlideraTxDetailsPage {

  public tx: any;

  constructor(
    private logger: Logger,
    private navParams: NavParams,
    private viewCtrl: ViewController
  ) {
    this.tx = this.navParams.data.tx;
  }

  public cancel(): void {
    this.viewCtrl.dismiss();
  }
}