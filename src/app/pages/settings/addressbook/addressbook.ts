import { Component } from '@angular/core';
import * as _ from 'lodash';
import { Subject } from 'rxjs';

import { AddressBookProvider, Contact } from 'src/app/providers/address-book/address-book';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'page-addressbook',
  templateUrl: 'addressbook.html',
  styleUrls: ['addressbook.scss']
})
export class AddressbookPage {
  public addressbook: Contact[];
  public filteredAddressbook: Subject<Contact[]>;

  public isEmptyList: boolean;
  public migratingContacts: boolean;
  wideHeaderPage;
  constructor(
    public router: Router,
    private addressbookProvider: AddressBookProvider,
    private location: Location
  ) {
    this.addressbook = [];
    this.filteredAddressbook = new Subject<Contact[]>();
    this.location.subscribe(val => {
      if (val.pop) {
        setTimeout(async () => {
              await this.initAddressbook().catch();
            }, 100);
      }
    });
  }

  ionViewDidEnter() {
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
    this.filteredAddressbook.next([]);
    const livenetContacts = await this.addressbookProvider.list('livenet');
    if (livenetContacts) this.addressbook.push(...livenetContacts);
    const testnetContacts = await this.addressbookProvider.list('testnet');
    if (testnetContacts) this.addressbook.push(...testnetContacts);
    this.isEmptyList = _.isEmpty(this.addressbook);
    if (!this.isEmptyList)
      this.filteredAddressbook.next(_.orderBy(this.addressbook, 'name'));
  }

  public addEntry(): void {
    this.router.navigate(['/address-book-add']);
  }

  public viewEntry(contact): void {
     this.router.navigate(['/address-book-view'], {state: {contact: contact}});
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
      this.filteredAddressbook.next(result);
    } else {
      // Reset items back to all of the items
      this.filteredAddressbook.next(_.clone(this.addressbook));
    }
  }
}
