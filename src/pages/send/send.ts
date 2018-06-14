import { Component } from '@angular/core';
import { Events, NavController, NavParams } from 'ionic-angular';
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
import { TxFormatProvider } from '../../providers/tx-format/tx-format';
import { PaperWalletPage } from '../paper-wallet/paper-wallet';
import { AddressbookAddPage } from '../settings/addressbook/add/add';
import { WalletTabsChild } from '../wallet-tabs/wallet-tabs-child';
import { WalletTabsProvider } from '../wallet-tabs/wallet-tabs.provider';
import { AmountPage } from './amount/amount';
import { ConfirmPage } from './confirm/confirm';

export interface FlatWallet {
  color: string;
  name: string;
  recipientType: 'wallet';
  coin: 'btc' | 'bch';
  network: 'testnet' | 'mainnet';
  m: number;
  n: number;
  needsBackup: boolean;
  isComplete: () => boolean;
  getAddress: () => Promise<string>;
}

@Component({
  selector: 'page-send',
  templateUrl: 'send.html'
})
export class SendPage extends WalletTabsChild {
  public search: string = '';
  public walletsBtc;
  public walletsBch;
  public walletBchList: FlatWallet[];
  public walletBtcList: FlatWallet[];
  public contactsList = [];
  public filteredContactsList = [];
  public hasBtcWallets: boolean;
  public hasBchWallets: boolean;
  public hasContacts: boolean;
  public contactsShowMore: boolean;
  private CONTACTS_SHOW_LIMIT: number = 10;
  private currentContactsPage: number = 0;

  public amount: string;
  public fiatAmount: number;
  public fiatCode: string;

  constructor(
    navCtrl: NavController,
    private navParams: NavParams,
    profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private addressBookProvider: AddressBookProvider,
    private logger: Logger,
    private incomingDataProvider: IncomingDataProvider,
    private popupProvider: PopupProvider,
    private addressProvider: AddressProvider,
    private events: Events,
    private externalLinkProvider: ExternalLinkProvider,
    private txFormatProvider: TxFormatProvider,
    walletTabsProvider: WalletTabsProvider
  ) {
    super(navCtrl, profileProvider, walletTabsProvider);
  }

  ionViewDidLoad() {
    this.amount = this.txFormatProvider.formatAmountStr(
      this.navParams.get('coin'),
      parseInt(this.navParams.get('amount'), 10)
    );
    this.fiatAmount = this.navParams.get('fiatAmount');
    this.fiatCode = this.navParams.get('fiatCode');
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

    this.walletBchList = this.getBchWalletsList();
    this.walletBtcList = this.getBtcWalletsList();
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

  private getBchWalletsList(): FlatWallet[] {
    return this.hasBchWallets ? this.getRelevantWallets(this.walletsBch) : [];
  }

  private getBtcWalletsList(): FlatWallet[] {
    return this.hasBtcWallets ? this.getRelevantWallets(this.walletsBtc) : [];
  }

  private getRelevantWallets(rawWallets): FlatWallet[] {
    return rawWallets
      .map(wallet => this.flattenWallet(wallet))
      .filter(wallet => this.filterIrrelevantRecipients(wallet));
  }

  private updateContactsList(): void {
    this.addressBookProvider.list().then(ab => {
      this.hasContacts = _.isEmpty(ab) ? false : true;
      if (!this.hasContacts) return;

      let contactsList = [];
      _.each(ab, (v, k: string) => {
        contactsList.push({
          name: _.isObject(v) ? v.name : v,
          address: k,
          network: this.addressProvider.validateAddress(k).network,
          email: _.isObject(v) ? v.email : null,
          recipientType: 'contact',
          coin: this.addressProvider.validateAddress(k).coin,
          getAddress: () => Promise.resolve(k)
        });
      });
      this.contactsList = contactsList.filter(c =>
        this.filterIrrelevantRecipients(c)
      );
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

  private flattenWallet(wallet): FlatWallet {
    return {
      color: wallet.color,
      name: wallet.name,
      recipientType: 'wallet',
      coin: wallet.coin,
      network: wallet.network,
      m: wallet.credentials.m,
      n: wallet.credentials.n,
      isComplete: wallet.isComplete(),
      needsBackup: wallet.needsBackup,
      getAddress: () => this.walletProvider.getAddress(wallet, false)
    };
  }

  private filterIrrelevantRecipients(recipient: {
    coin: string;
    network: string;
  }): boolean {
    return this.wallet
      ? this.wallet.coin === recipient.coin &&
          this.wallet.network === recipient.network
      : true;
  }

  public showMore(): void {
    this.currentContactsPage++;
    this.updateContactsList();
  }

  public openScanner(): void {
    this.navCtrl.parent.select(2);
  }

  public findContact(search: string): void {
    if (
      this.incomingDataProvider.redir(search, {
        amount: this.navParams.get('amount'),
        coin: this.navParams.get('coin')
      })
    )
      return;
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
        // this.navCtrl.push(AmountPage, {
        //   recipientType: item.recipientType,
        //   toAddress: addr,
        //   name: item.name,
        //   email: item.email,
        //   color: item.color,
        //   coin: item.coin,
        //   network: item.network
        // });
        this.navCtrl.push(ConfirmPage, {
          recipientType: item.recipientType,
          amount: parseInt(this.navParams.data.amount, 10),
          toAddress: addr,
          name: item.name,
          email: item.email,
          color: item.color,
          coin: item.coin,
          network: item.network
        });

        // toAddress: this.navParams.data.toAddress,
        // amount: parseInt(this.navParams.data.amount, 10),
        // sendMax: this.navParams.data.useSendMax ? true : false,
        // description: this.navParams.data.description,
        // paypro: this.navParams.data.paypro,
        // spendUnconfirmed: this.config.wallet.spendUnconfirmed,
        return;
      })
      .catch(err => {
        this.logger.error('Send: could not getAddress', err);
      });
  }
}
