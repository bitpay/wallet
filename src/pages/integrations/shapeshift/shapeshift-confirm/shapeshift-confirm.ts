import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

@Component({
  selector: 'page-shapeshift-confirm',
  templateUrl: 'shapeshift-confirm.html',
})
export class ShapeshiftConfirmPage {

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ShapeshiftConfirmPage');
  }

}
