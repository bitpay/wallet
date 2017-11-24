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

  private cache: boolean = false;
  private addressbook: Array<object> = [];

  public isEmptyList: boolean;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    private logger: Logger,
    private addressbookProvider: AddressBookProvider
  ) {
    this.initAddressbook();
  }

  ionViewDidEnter() {
    if (this.cache) this.initAddressbook();
    this.cache = true;
  }

  private initAddressbook() {
    this.addressbookProvider.list().then((ab) => {
      this.isEmptyList = _.isEmpty(ab);

      let contacts: Array<object> = [];
      _.each(ab, function (v, k) {
        contacts.push({
          name: _.isObject(v) ? v.name : v,
          address: k,
          email: _.isObject(v) ? v.email : null
        });
      });
      this.addressbook = _.clone(contacts);

    }).catch((err) => {
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

  public addEntry() {
    this.navCtrl.push(AddressbookAddPage);
  };

  public viewEntry(ab: any) {
    this.navCtrl.push(AddressbookViewPage, { address: ab.address });
  }

  public getItems(ev: any) {
    // Reset items back to all of the items
    this.initAddressbook();

    // set val to the value of the searchbar
    let val = ev.target.value;

    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {
      this.addressbook = this.addressbook.filter((item) => {
        let name = item['name'];
        return _.includes(name.toLowerCase(), val.toLowerCase());
      });
    }
  }

}
