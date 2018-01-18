import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { AddressbookAddPage } from './add/add';
import { AddressbookViewPage } from './view/view';
import { AddressBookProvider } from '../../../providers/address-book/address-book';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';

@Component({
  selector: 'page-addressbook',
  templateUrl: 'addressbook.html',
})
export class AddressbookPage {

  private cache: boolean;
  public addressbook: Array<any>;
  public filteredAddressbook: Array<any>;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    private logger: Logger,
    private addressbookProvider: AddressBookProvider
  ) {
    this.cache = false;
    this.addressbook = [];
    this.filteredAddressbook = [];
    this.initAddressbook();
  }

  ionViewDidEnter() {
    if (this.cache) this.initAddressbook();
    this.cache = true;
  }

  private initAddressbook(): void {
    this.addressbookProvider.list().then((addressBook: any) => {
      this.addressbook = _.clone(addressBook);
      this.filteredAddressbook = _.clone(addressBook);
    }).catch((err: any) => {
      this.logger.error(err);
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
  };

  public addEntry(): void {
    this.navCtrl.push(AddressbookAddPage);
  };

  public viewEntry(contact: any): void {
    this.navCtrl.push(AddressbookViewPage, { contact: contact });
  }

  public getItems(event: any): void {

    // set val to the value of the searchbar
    let val = event.target.value;

    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {
      let result = _.filter(this.addressbook, (item: any) => {
        let name = item['name'];
        return _.includes(name.toLowerCase(), val.toLowerCase());
      });
      this.filteredAddressbook = result;
    } else {
      // Reset items back to all of the items
      this.initAddressbook();
    }
  }

}
