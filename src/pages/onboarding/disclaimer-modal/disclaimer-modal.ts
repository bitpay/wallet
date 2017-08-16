import { Component } from '@angular/core';
import { IonicPage, NavParams, ViewController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-disclaimer-modal',
  templateUrl: 'disclaimer-modal.html',
})
export class DisclaimerModalPage {

  constructor(public navParams: NavParams, private view: ViewController) {
  }

  ionViewDidLoad() {
  }

  closeModal() {
    this.view.dismiss();
  }

}
