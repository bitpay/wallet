import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { AddressBookProvider } from '../../providers/address-book/address-book';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';

@Component({
  selector: 'page-addressbook',
  templateUrl: 'addressbook.html',
})
export class AddressbookPage {

  private isEmptyList: boolean;
  private addressbook: Array<object> = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    private logger: Logger,
    private addressbookProvider: AddressBookProvider
  ) {
    this.initAddressbook();
  }

  private initAddressbook() {
    this.addressbookProvider.list().then((ab) => {
      this.isEmptyList = _.isEmpty(ab);

      let contacts: Array<object> = [];
      _.each(ab, function(v, k) {
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

}
