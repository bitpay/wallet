import { Component } from '@angular/core';
import { Events, NavController } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { AddressBookProvider } from '../../providers/address-book/address-book';
import { AddressProvider } from '../../providers/address/address';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { IncomingDataProvider } from '../../providers/incoming-data/incoming-data';
import { Logger } from '../../providers/logger/logger';
import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';
import { WalletProvider } from '../../providers/wallet/wallet';

// Pages
import { PaperWalletPage } from '../paper-wallet/paper-wallet';
import { AddressbookAddPage } from '../settings/addressbook/add/add';
import { AmountPage } from './amount/amount';

@Component({
  selector: 'page-send',
  templateUrl: 'send.html'
})
export class SendPage {
  public search: string = '';
  public walletsBtc;
  public walletsBch;
  public walletBchList;
  public walletBtcList;
  public contactsList = [];
  public filteredContactsList = [];
  public hasBtcWallets: boolean;
  public hasBchWallets: boolean;
  public hasContacts: boolean;
  public contactsShowMore: boolean;
  private CONTACTS_SHOW_LIMIT: number = 10;
  private currentContactsPage: number = 0;

  constructor(
    private navCtrl: NavController,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private addressBookProvider: AddressBookProvider,
    private logger: Logger,
    private incomingDataProvider: IncomingDataProvider,
    private popupProvider: PopupProvider,
    private addressProvider: AddressProvider,
    private events: Events,
    private externalLinkProvider: ExternalLinkProvider
  ) {}

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad SendPage');
  }

  ionViewWillLeave() {
    this.events.unsubscribe('finishIncomingDataMenuEvent');
  }

  ionViewWillEnter() {
    this.walletsBtc = this.profileProvider.getWallets({ coin: 'btc' });
    this.walletsBch = this.profileProvider.getWallets({ coin: 'bch' });
    this.hasBtcWallets = !_.isEmpty(this.walletsBtc);
    this.hasBchWallets = !_.isEmpty(this.walletsBch);

    this.events.subscribe('finishIncomingDataMenuEvent', data => {
      switch (data.redirTo) {
        case 'AmountPage':
          this.sendPaymentToAddress(data.value, data.coin);
          break;
        case 'AddressBookPage':
          this.addToAddressBook(data.value);
          break;
        case 'OpenExternalLink':
          this.goToUrl(data.value);
          break;
        case 'PaperWalletPage':
          this.scanPaperWallet(data.value);
          break;
      }
    });

    this.updateBchWalletsList();
    this.updateBtcWalletsList();
    this.updateContactsList();
  }

  ionViewDidEnter() {
    this.search = '';
  }

  private goToUrl(url: string): void {
    this.externalLinkProvider.open(url);
  }

  private sendPaymentToAddress(bitcoinAddress: string, coin: string): void {
    this.navCtrl.push(AmountPage, { toAddress: bitcoinAddress, coin });
  }

  private addToAddressBook(bitcoinAddress: string): void {
    this.navCtrl.push(AddressbookAddPage, { addressbookEntry: bitcoinAddress });
  }

  private scanPaperWallet(privateKey: string) {
    this.navCtrl.push(PaperWalletPage, { privateKey });
  }

  private updateBchWalletsList(): void {
    this.walletBchList = [];

    if (!this.hasBchWallets) return;

    _.each(this.walletsBch, v => {
      this.walletBchList.push({
        color: v.color,
        name: v.name,
        recipientType: 'wallet',
        coin: v.coin,
        network: v.network,
        m: v.credentials.m,
        n: v.credentials.n,
        isComplete: v.isComplete(),
        needsBackup: v.needsBackup,
        getAddress: (): Promise<any> => {
          return new Promise((resolve, reject) => {
            this.walletProvider
              .getAddress(v, false)
              .then(addr => {
                return resolve(addr);
              })
              .catch(err => {
                return reject(err);
              });
          });
        }
      });
    });
  }

  private updateBtcWalletsList(): void {
    this.walletBtcList = [];

    if (!this.hasBtcWallets) return;

    _.each(this.walletsBtc, v => {
      this.walletBtcList.push({
        color: v.color,
        name: v.name,
        recipientType: 'wallet',
        coin: v.coin,
        network: v.network,
        m: v.credentials.m,
        n: v.credentials.n,
        isComplete: v.isComplete(),
        needsBackup: v.needsBackup,
        getAddress: (): Promise<any> => {
          return new Promise((resolve, reject) => {
            this.walletProvider
              .getAddress(v, false)
              .then(addr => {
                return resolve(addr);
              })
              .catch(err => {
                return reject(err);
              });
          });
        }
      });
    });
  }

  private updateContactsList(): void {
    this.addressBookProvider.list().then(ab => {
      this.hasContacts = _.isEmpty(ab) ? false : true;
      if (!this.hasContacts) return;

      this.contactsList = [];
      _.each(ab, (v, k: string) => {
        this.contactsList.push({
          name: _.isObject(v) ? v.name : v,
          address: k,
          network: this.addressProvider.validateAddress(k).network,
          email: _.isObject(v) ? v.email : null,
          recipientType: 'contact',
          coin: this.addressProvider.validateAddress(k).coin,
          getAddress: () => {
            return new Promise(resolve => {
              return resolve(k);
            });
          }
        });
      });
      let shortContactsList = _.clone(
        this.contactsList.slice(
          0,
          (this.currentContactsPage + 1) * this.CONTACTS_SHOW_LIMIT
        )
      );
      this.filteredContactsList = _.clone(shortContactsList);
      this.contactsShowMore =
        this.contactsList.length > shortContactsList.length;
    });
  }

  public showMore(): void {
    this.currentContactsPage++;
    this.updateContactsList();
  }

  public openScanner(): void {
    this.navCtrl.parent.select(2);
  }

  public findContact(search: string): void {
    if (this.incomingDataProvider.redir(search)) return;
    if (search && search.trim() != '') {
      let result = _.filter(this.contactsList, item => {
        let val = item.name;
        return _.includes(val.toLowerCase(), search.toLowerCase());
      });
      this.filteredContactsList = result;
    } else {
      this.updateContactsList();
    }
  }

  public goToAmount(item): void {
    item
      .getAddress()
      .then((addr: string) => {
        if (!addr) {
          // Error is already formated
          this.popupProvider.ionicAlert('Error - no address');
          return;
        }
        this.logger.debug('Got address:' + addr + ' | ' + item.name);
        this.navCtrl.push(AmountPage, {
          recipientType: item.recipientType,
          toAddress: addr,
          name: item.name,
          email: item.email,
          color: item.color,
          coin: item.coin,
          network: item.network
        });
        return;
      })
      .catch(err => {
        this.logger.error('Send: could not getAddress', err);
      });
  }

  public close() {
    // console.log('this.navCtrl', this.navCtrl);
    this.navCtrl.parent.viewCtrl.dismiss();
    // this.navCtrl.parent.viewCtrl.pop();
  }
}
