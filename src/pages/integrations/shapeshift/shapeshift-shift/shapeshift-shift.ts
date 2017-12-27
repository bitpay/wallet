import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

@Component({
  selector: 'page-shapeshift-shift',
  templateUrl: 'shapeshift-shift.html',
})
export class ShapeshiftShiftPage {

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ShapeshiftShiftPage');
  }

}
