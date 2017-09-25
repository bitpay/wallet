import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ProfileProvider } from '../../providers/profile/profile';
import { PopupProvider } from '../../providers/popup/popup';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public wallets;

  constructor(
    public navCtrl: NavController,
    private profile: ProfileProvider,
    private popup: PopupProvider,
  ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad HomePage');
    this.wallets = this.profile.bind();
    console.log('[home.ts:20]', this.wallets); //TODO
  }

  openPopup() {
    //this.popup._ionicAlert('Hola mi nombre es gabriel', 'si, ese es mi nombre', 'Si');
    //this.popup._ionicConfirm('hola aceptas este dinerillo?', 'dinero gratis', 'Si', 'cancel');
    //this.popup._ionicPrompt('Ingrese un valor', 'Ingreselo por favor', 'Si', 'no', null);
  }
}
