import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

// Pages
import { AddPage } from '../../add/add';

@Component({
  selector: 'create-new-wallet',
  templateUrl: 'create-new-wallet.html'
})
export class CreateNewWalletPage {
  constructor(private navCtrl: NavController) {}

  public goToAddWalletPage() {
    this.navCtrl.push(AddPage);
  }
}
