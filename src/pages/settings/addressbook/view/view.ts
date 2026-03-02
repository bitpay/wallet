import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';

// Pages
import { AmountPage } from '../../../../pages/send/amount/amount';

// Providers
import { AddressBookProvider } from '../../../../providers/address-book/address-book';
import { AddressProvider } from '../../../../providers/address/address';
import { ActionSheetProvider } from '../../../../providers/index';
import { PopupProvider } from '../../../../providers/popup/popup';

@Component({
  selector: 'page-addressbook-view',
  templateUrl: 'view.html'
})
export class AddressbookViewPage {
  public contact;
  public address: string;
  public coin: string;
  public email: string;
  public tag?: string;
  public name: string;
  public network: string;

  constructor(
    private addressBookProvider: AddressBookProvider,
    private addressProvider: AddressProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private popupProvider: PopupProvider,
    private translate: TranslateService,
    private actionSheetProvider: ActionSheetProvider,
    private events: Events
  ) {
    this.address = this.navParams.data.contact.address;
    if (
      !this.navParams.data.contact.coin ||
      !this.navParams.data.contact.network
    ) {
      const addrData = this.addressProvider.getCoinAndNetwork(this.address);
      if (!this.navParams.data.contact.coin) this.coin = addrData.coin; // preserve coin
      this.network = addrData.network;
    } else {
      this.coin = this.navParams.data.contact.coin;
      this.network = this.navParams.data.contact.network;
    }
    this.name = this.navParams.data.contact.name;
    this.email = this.navParams.data.contact.email;
    this.tag = this.navParams.data.contact.tag;
  }

  ionViewDidLoad() {}

  private sendTo(): void {
    this.navCtrl.push(AmountPage, {
      toAddress: this.address,
      name: this.name,
      email: this.email,
      destinationTag: this.tag,
      coin: this.coin,
      recipientType: 'contact',
      network: this.network
    });
  }

  private remove(): void {
    const title = this.translate.instant('Warning!');
    const message = this.translate.instant(
      'Are you sure you want to delete this contact?'
    );
    this.popupProvider.ionicConfirm(title, message, null, null).then(res => {
      if (!res) return;
      this.addressBookProvider
        .remove(this.address, this.network, this.coin)
        .then(() => {
          this.events.publish('Local/AddressBook/Changed');
          this.navCtrl.pop();
        })
        .catch(err => {
          this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
          return;
        });
    });
  }

  public showMoreOptions(): void {
    const optionsSheet = this.actionSheetProvider.createOptionsSheet(
      'address-book',
      { coin: this.coin.toUpperCase() }
    );
    optionsSheet.present();

    optionsSheet.onDidDismiss(option => {
      if (option == 'send-to-contact') this.sendTo();
      if (option == 'delete-contact') this.remove();
    });
  }
}
