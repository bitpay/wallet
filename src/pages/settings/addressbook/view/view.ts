import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';

// Pages
import { AmountPage } from '../../../../pages/send/amount/amount';

// Providers
import { AddressBookProvider } from '../../../../providers/address-book/address-book';
import { AddressProvider } from '../../../../providers/address/address';
import { PopupProvider } from '../../../../providers/popup/popup';

@Component({
  selector: 'page-addressbook-view',
  templateUrl: 'view.html'
})
export class AddressbookViewPage {
  public contact;
  public address: string;
  public name: string;
  public email: string;

  constructor(
    private addressBookProvider: AddressBookProvider,
    private addressProvider: AddressProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private popupProvider: PopupProvider,
    private translate: TranslateService
  ) {
    this.address = this.navParams.data.contact.address;
    this.name = this.navParams.data.contact.name;
    this.email = this.navParams.data.contact.email;
  }

  ionViewDidLoad() {}

  public sendTo(): void {
    this.navCtrl.push(AmountPage, {
      toAddress: this.address,
      name: this.name,
      email: this.email,
      coin: this.addressProvider.getCoin(this.address),
      recipientType: 'contact',
      network: this.addressProvider.getNetwork(this.address)
    });
  }

  public remove(addr: string): void {
    var title = this.translate.instant('Warning!');
    var message = this.translate.instant(
      'Are you sure you want to delete this contact?'
    );
    this.popupProvider.ionicConfirm(title, message, null, null).then(res => {
      if (!res) return;
      this.addressBookProvider
        .remove(addr)
        .then(() => {
          this.navCtrl.pop();
        })
        .catch(err => {
          this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
          return;
        });
    });
  }
}
