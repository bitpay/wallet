import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

// Pages
import { CreateVaultPage } from '../../create-vault/create-vault';

@Component({
  selector: 'create-new-vault',
  templateUrl: 'create-new-vault.html'
})
export class CreateNewVaultHome {
  constructor(private navCtrl: NavController) {}

  public goToCreateVaultPage() {
    this.navCtrl.push(CreateVaultPage);
  }
}
