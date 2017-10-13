import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { TouchIdProvider } from '../../providers/touchid/touchid';

@Component({
  selector: 'page-fingerprint',
  templateUrl: 'fingerprint.html',
})
export class FingerprintModalPage {

  constructor(
    private touchid: TouchIdProvider,
    private viewCtrl: ViewController
  ) {
    touchid.check().then(() => {
      this.viewCtrl.dismiss();
    });
  }

}
