import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-add',
  templateUrl: 'add.html'
})
export class AddPage {
  constructor(public navCtrl: NavController) {}

  ionViewDidLoad() {
    console.log('ionViewDidLoad AddPage');
  }

  goToSingleWallet() {
    // this.navCtrl.push();
  }

  goToSharedeWallet() {
    // this.navCtrl.push();
  }

  goToJoinWallet() {
    // this.navCtrl.push();
  }

  goToImportWallet() {
    // this.navCtrl.push();
  }
}
