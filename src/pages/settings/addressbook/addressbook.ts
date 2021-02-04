import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { AddressBookProvider } from '../../../providers/address-book/address-book';
import { AddressProvider } from '../../../providers/address/address';
import { Logger } from '../../../providers/logger/logger';
import { AddressbookAddPage } from './add/add';
import { AddressbookViewPage } from './view/view';

export interface Contact {
  name: string;
  email: string;
  address: string;
  tag: string;
}
@Component({
  selector: 'page-addressbook',
  templateUrl: 'addressbook.html'
})
export class AddressbookPage implements OnInit {
  private cache: boolean = false;
  public addressbook: object[] = [];
  public filteredAddressbookPromise: Promise<object[]>;

  public isEmptyList: boolean;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private logger: Logger,
    private addressbookProvider: AddressBookProvider,
    private addressProvider: AddressProvider
  ) {}
  ngOnInit() {
    this.filteredAddressbookPromise = this.updateContactsList();
    this.filteredAddressbookPromise.then(addressBook => {
      this.addressbook = _.clone(addressBook);
    });
  }

  ionViewDidEnter() {
    if (this.cache) this.filteredAddressbookPromise = this.updateContactsList();
    this.cache = true;
  }

  updateContactsList(): Promise<object[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.initAddressbook().then(list => {
          this.logger.info(`Finish getting Contacts List`);
          resolve(list);
        });
      }, 700); // Delay for page transition
    });
  }

  async initAddressbook() {
    const contacts = await this.addressbookProvider.list();
    const contactsList = await this.processEachContact(contacts);
    return contactsList;
  }

  processEachContact(contacts: [Contact]): Promise<any[]> {
    return new Promise(resolve => {
      const contactsList = [];
      _.each(contacts, (contact, k: string) => {
        const coinInfo = this.getCoinAndNetwork(k);
        if (coinInfo) {
          contactsList.push({
            name: _.isObject(contact) ? contact.name : contact,
            address: k,
            email: _.isObject(contact) ? contact.email : null,
            tag: _.isObject(contact) ? contact.tag : null,
            coin: coinInfo.coin,
            network: coinInfo.network
          });
        }
      });
      return resolve(contactsList);
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
      this.filteredAddressbookPromise = Promise.resolve(result);
    } else {
      // Reset items back to all of the items
      this.filteredAddressbookPromise = Promise.resolve(this.addressbook);
    }
  }

  private getCoinAndNetwork(addr: string): { coin: string; network: string } {
    return this.addressProvider.getCoinAndNetwork(addr);
  }
}
