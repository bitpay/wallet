import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { AddressBookProvider } from '../../../../providers/address-book/address-book';

@Component({
  selector: 'page-addressbook-view',
  templateUrl: 'view.html',
})
export class AddressbookViewPage {

  private address: string;

  public contact: Object = {
    name: '',
    address: '',
    email: ''
  };

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    public ab: AddressBookProvider
  ) {
    this.address = this.navParams.get('address');
  }

  ionViewDidLoad() {
    this.ab.get(this.address).then((entry) => {
      this.contact = entry;
    }).catch((err) => {
      let alertError = this.alertCtrl.create({
        title: err,
        buttons: [
          {
            text: 'Go back',
            handler: () => {
              this.navCtrl.pop();
            }
          }
        ]
      });
      alertError.present();
    });
  }

  public remove(): void {
    this.ab.remove(this.address).then(() => {
      this.navCtrl.pop();
    }).catch((err) => {
      let alertError = this.alertCtrl.create({
        title: err,
        buttons: [
          {
            text: 'OK'
          }
        ]
      });
      alertError.present();
    });
  }

}
