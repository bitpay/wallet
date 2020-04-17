import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { AddressBookProvider } from '../../../providers/address-book/address-book';
import { AddressProvider } from '../../../providers/address/address';
import { Logger } from '../../../providers/logger/logger';
import { AddressbookAddPage } from './add/add';
import { AddressbookViewPage } from './view/view';

@Component({
  selector: 'page-addressbook',
  templateUrl: 'addressbook.html'
})
export class AddressbookPage {
  private cache: boolean = false;
  public addressbook: object[] = [];
  public filteredAddressbook: object[] = [];

  public isEmptyList: boolean;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private logger: Logger,
    private addressbookProvider: AddressBookProvider,
    private addressProvider: AddressProvider
  ) {
    this.initAddressbook();
  }

  ionViewDidEnter() {
    if (this.cache) this.initAddressbook();
    this.cache = true;
  }

  private initAddressbook(): void {
    this.addressbookProvider
      .list()
      .then(addressBook => {
        this.isEmptyList = _.isEmpty(addressBook);

        let contacts: object[] = [];
        _.each(addressBook, (contact, k: string) => {
          const coinInfo = this.getCoinAndNetwork(k);
          contacts.push({
            name: _.isObject(contact) ? contact.name : contact,
            address: k,
            email: _.isObject(contact) ? contact.email : null,
            tag: _.isObject(contact) ? contact.tag : null,
            coin: coinInfo.coin,
            network: coinInfo.network
          });
        });
        this.addressbook = _.clone(contacts);
        this.filteredAddressbook = _.clone(this.addressbook);
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  public addEntry(): void {
    this.navCtrl.push(AddressbookAddPage);
  }

  public viewEntry(contact): void {
    this.navCtrl.push(AddressbookViewPage, { contact });
  }

  public getItems(event): void {
    // set val to the value of the searchbar
    let val = event.target.value;

    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {
      let result = _.filter(this.addressbook, item => {
        let name = item['name'];
        return _.includes(name.toLowerCase(), val.toLowerCase());
      });
      this.filteredAddressbook = result;
    } else {
      // Reset items back to all of the items
      this.initAddressbook();
    }
  }

  private getCoinAndNetwork(addr: string): { coin: string; network: string } {
    return this.addressProvider.getCoinAndNetwork(addr);
  }
}
