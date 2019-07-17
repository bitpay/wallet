import { Component } from '@angular/core';
import { AlertController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { AddressBookProvider } from '../../../providers/address-book/address-book';
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

  public isEmptyList: boolean;
  public showReorder: boolean;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    private logger: Logger,
    private addressbookProvider: AddressBookProvider
  ) {
    this.showReorder = false;
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
        const promises = [];
        _.each(addressBook, (contact, k: string) => {
          promises.push(
            this.getAddressOrder(k).then(value => {
              let entry = {
                address: contact['address'],
                email: contact['email'],
                name: contact['name'],
                order: value ? value : 0
              };

              contacts.push(entry);
              return Promise.resolve();
            })
          );
        });

        Promise.all(promises).then(() => {
          this.addressbook = contacts;
        });
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  public reorder(): void {
    this.showReorder = !this.showReorder;
  }

  public setAddressOrder(address: string, index: number): void {
    this.addressbookProvider.setAddressOrder(address, index).then(() => {
      this.logger.debug(
        'Address new order stored for ' + address + ': ' + index
      );
    });
    if (this.addressbook[address]) this.addressbook[address]['order'] = index;
  }

  public async getAddressOrder(address: string): Promise<any> {
    return this.addressbookProvider.getAddressOrder(address);
  }

  public reorderAddresses(indexes): void {
    const element = this.addressbook[indexes.from];
    this.addressbook.splice(indexes.from, 1);
    this.addressbook.splice(indexes.to, 0, element);
    _.each(this.addressbook, (entry, index: number) => {
      entry['order'] = index;
      this.setAddressOrder(entry['address'], index);
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
      this.addressbook = result;
    } else {
      // Reset items back to all of the items
      this.initAddressbook();
    }
  }
}
