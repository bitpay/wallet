import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { ProfileProvider } from '../../providers/profile/profile';
import { WalletProvider } from '../../providers/wallet/wallet';
import { AddressBookProvider } from '../../providers/address-book/address-book';
import { BwcProvider } from '../../providers/bwc/bwc';
import { IncomingDataProvider } from '../../providers/incoming-data/incoming-data';
import { PopupProvider } from '../../providers/popup/popup';

//pages
import { AmountPage } from './amount/amount';
import { CreateWalletPage } from '../add/create-wallet/create-wallet';

import * as _ from 'lodash';

@Component({
  selector: 'page-send',
  templateUrl: 'send.html',
})
export class SendPage {
  public search: string = '';
  public wallets: any;
  public walletList: any;
  public contactsList: any;
  public hasWallets: boolean;
  public hasContacts: boolean;
  public contactsShowMore: boolean;
  public searchFocus: boolean;
  private CONTACTS_SHOW_LIMIT: number = 10;
  private currentContactsPage: number = 0;

  constructor(
    private navCtrl: NavController,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private addressBookProvider: AddressBookProvider,
    private logger: Logger,
    private bwcProvider: BwcProvider,
    private incomingDataProvider: IncomingDataProvider,
    private popupProvider: PopupProvider
  ) {

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SendPage');
  }

  ionViewDidEnter() {
    this.wallets = this.profileProvider.getWallets({
      onlyComplete: true
    });
    this.hasWallets = !(_.isEmpty(this.wallets));
    console.log(this.hasWallets);
    this.updateWalletsList();
    this.updateContactsList();
  }

  private updateWalletsList(): void {
    if (!this.hasWallets) return;

    this.walletList = [];
    _.each(this.wallets, (v: any) => {
      this.walletList.push({
        color: v.color,
        name: v.name,
        recipientType: 'wallet',
        coin: v.coin,
        network: v.network,
        getAddress: (): Promise<any> => {
          return new Promise((resolve, reject) => {
            this.walletProvider.getAddress(v, false).then((addr) => {
              return resolve(addr);
            }).catch((err) => {
              return reject(err);
            });
          });
        }
      });
    });
  }

  private updateContactsList() {
    this.addressBookProvider.list().then((ab: any) => {

      this.hasContacts = _.isEmpty(ab) ? false : true;
      if (!this.hasContacts) return;

      this.contactsList = [];
      _.each(ab, (v: any, k: string) => {
        this.contactsList.push({
          name: _.isObject(v) ? v.name : v,
          address: k,
          email: _.isObject(v) ? v.email : null,
          recipientType: 'contact',
          coin: this.getCoin(k),
          getAddress: (): Promise<any> => {
            return new Promise((resolve, reject) => {
              return resolve(k);
            });
          }
        });
      });
      let contacts = this.contactsList.slice(0, (this.currentContactsPage + 1) * this.CONTACTS_SHOW_LIMIT);
      this.contactsShowMore = this.contactsList.length > contacts.length;
      return;
    });
  }

  private getCoin(address: string): string {
    let cashAddress = this.bwcProvider.getBitcoreCash().Address.isValid(address, 'livenet');
    if (cashAddress) {
      return 'bch';
    }
    return 'btc';
  }

  public openScanner(): void {
    this.navCtrl.parent.select(2);
  }

  public showMore(): void {
    this.currentContactsPage++;
    this.updateWalletsList();
  }

  public searchInFocus(): void {
    this.searchFocus = true;
  }

  public searchBlurred(): void {
    if (this.search == null || this.search.length == 0) {
      this.searchFocus = false;
    }
  }

  findContact(search: string): void {
    if (this.incomingDataProvider.redir(search)) return;
    if (!search || search.length < 2) {
      this.updateContactsList();
      return;
    }
    let result = _.filter(this.contactsList, (item: any) => {
      let val = item.name;
      return _.includes(val.toLowerCase(), search.toLowerCase());
    });
    this.contactsList = result;
  }

  public goToAmount(item: any): void {
    item.getAddress().then((addr: string) => {
      if (!addr) {
        //Error is already formated
        this.popupProvider.ionicAlert('Error - no address');
        return;
      }
      this.logger.debug('Got toAddress:' + addr + ' | ' + item.name);
      this.navCtrl.push(AmountPage, {
        recipientType: item.recipientType,
        toAddress: addr,
        toName: item.name,
        toEmail: item.email,
        toColor: item.color,
        coin: item.coin
      });
      return;
    }).catch((err: any) => {
      this.logger.warn(err);
    });
  };

  public createWallet(): void {
    this.navCtrl.push(CreateWalletPage, {});
  };

  // TODO check if wallets have balance

}
