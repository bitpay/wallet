import { Component } from '@angular/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import {
  AddressBookProvider,
  Contact
} from '../../../providers/address-book/address-book';
import { AddressbookAddPage } from './add/add';
import { AddressbookViewPage } from './view/view';

@Component({
  selector: 'page-addressbook',
  templateUrl: 'addressbook.html'
})
export class AddressbookPage {
  public addressbook: Contact[] = [];
  public filteredAddressbook: Contact[] = [];

  public isEmptyList: boolean;
  public migratingContacts: boolean;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private addressbookProvider: AddressBookProvider,
    private events: Events
  ) {}

  ionViewDidEnter() {
    this.events.subscribe('Local/AddressBook/Changed', async () =>
      this.initAddressbook()
    );
    this.migratingContacts = false;
    this.addressbookProvider.migratingContactsSubject.subscribe(_migrating => {
      this.migratingContacts = _migrating;
    });
    setTimeout(async () => {
      await this.initAddressbook().catch();
    }, 100);
  }

  private async initAddressbook() {
    this.addressbook = [];
    this.filteredAddressbook = [];
    const livenetContacts = await this.addressbookProvider.list('livenet');
    if (livenetContacts) this.addressbook.push(...livenetContacts);
    const testnetContacts = await this.addressbookProvider.list('testnet');
    if (testnetContacts) this.addressbook.push(...testnetContacts);
    this.filteredAddressbook.push(...this.addressbook);
    this.isEmptyList = _.isEmpty(this.addressbook);
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
      this.filteredAddressbook = _.clone(this.addressbook);
    }
  }
}
