import { Component } from '@angular/core';
import { IonicPage, NavParams, ViewController } from 'ionic-angular';

/**
 * Generated class for the DisclaimerModalPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-disclaimer-modal',
  templateUrl: 'disclaimer-modal.html',
})
export class DisclaimerModalPage {

  constructor(public navParams: NavParams, private view: ViewController) {
  }

  closeModal() {
    this.view.dismiss();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad DisclaimerModalPage');
  }

}
