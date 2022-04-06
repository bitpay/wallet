import { Component, ViewEncapsulation } from '@angular/core';
import * as _ from 'lodash';
import { Subject } from 'rxjs';

import { AddressBookProvider, Contact } from 'src/app/providers/address-book/address-book';
import { Router } from '@angular/router';
import { ActionSheetProvider, AppProvider, LoadingProvider } from 'src/app/providers';

@Component({
  selector: 'page-addressbook',
  templateUrl: 'addressbook.html',
  styleUrls: ['addressbook.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddressbookPage {
  public addressbook: Contact[];
  public filteredAddressbook: Subject<any>;
  public addressBookSortAlpha: any = [];
  private navParamsData: any;
  public currentTheme: any;

  public isEmptyList: boolean;
  public migratingContacts: boolean;
  wideHeaderPage;
  constructor(
    private appProvider: AppProvider,
    private actionSheetProvider: ActionSheetProvider,
    public router: Router,
    private addressbookProvider: AddressBookProvider,
    private loadingCtr: LoadingProvider
  ) {
    if (this.router.getCurrentNavigation()) {
      this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData =  history ? history.state : undefined;
    }
    this.addressbook = [];
    this.filteredAddressbook = new Subject<[]>();
    this.currentTheme = this.appProvider.themeProvider.currentAppTheme;
  }

  ionViewWillEnter() {
    this.loadingCtr.autoLoader();
    this.migratingContacts = false;
    this.addressbookProvider.migratingContactsSubject.subscribe(_migrating => {
      this.migratingContacts = _migrating;
    });
    this.initAddressbook();
  }

  sortAddressBookAlpha() {
    this.addressBookSortAlpha = [];
    const sort = this.addressbook.sort((a,b) => {
      if (a.name < b.name) { return -1; }
      if (a.name > b.name) { return 1; }
      return 0;
    });

    let last = null;

    for (let i = 0; i < sort.length; i++) {
      const contact = sort[i];
      if (!last || last != contact.name[0]) {
        last = contact.name[0];
        this.addressBookSortAlpha.push({key: last, contact: []});
      }
      this.addressBookSortAlpha[this.addressBookSortAlpha.length - 1].contact.push(contact);
    }
  }

  private async initAddressbook() {
    this.addressbook = [];
    this.filteredAddressbook.next([]);
    const livenetContacts = await this.addressbookProvider.list('livenet');
    if (livenetContacts) this.addressbook.push(...livenetContacts);
    const testnetContacts = await this.addressbookProvider.list('testnet');
    if (testnetContacts) this.addressbook.push(...testnetContacts);
    this.isEmptyList = _.isEmpty(this.addressbook);
    if (!this.isEmptyList) {
      this.sortAddressBookAlpha();
      this.filteredAddressbook.next(this.addressBookSortAlpha);
    }
  }

  public addEntry() {
    this.showAddContactModal();
  }

  public showAddContactModal(params?) {
    const addContactModal = this.actionSheetProvider.createAddContactComponent(params);
    addContactModal.present({ maxHeight: '48%%', minHeight: '48%%' });
    addContactModal.onDidDismiss((rs) => {
      if (rs) setTimeout(async () => {
        await this.initAddressbook().catch();
      }, 100);
    });
  }

  public viewEntry(contact): void {
     this.router.navigate(['/address-book-view'], {state: {contact: contact}});
  }

  public getItems(event): void {
    // set val to the value of the searchbar
    let val = event.target.value;

    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {
      let list = [];
      this.addressBookSortAlpha.forEach(element => {
        let result = _.filter(element.contact, item => {
          let name = item['name'];
          return _.includes(name.toLowerCase(), val.toLowerCase());
        });
        if (result.length != 0) list.push({key: element.key, contact: result})
      });
      this.filteredAddressbook.next(list);
    } else {
      // Reset items back to all of the items
      this.filteredAddressbook.next(_.clone(this.addressBookSortAlpha));
    }
  }
}
