import { Component } from "@angular/core";
import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-bitpay-phases-on-the-list-page',
  templateUrl: './on-the-list-page.html'
})
export class OnTheList {
  constructor(public navCtrl: NavController) { }

  goBack() {
    this.navCtrl.popToRoot();
  }
}