import { Component } from '@angular/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AddressBookProvider } from '../../providers/address-book/address-book';
import { AddressProvider } from '../../providers/address/address';
import { AppProvider } from '../../providers/app/app';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { IncomingDataProvider } from '../../providers/incoming-data/incoming-data';
import { Logger } from '../../providers/logger/logger';
import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';
import { TxFormatProvider } from '../../providers/tx-format/tx-format';
import { Coin, WalletProvider } from '../../providers/wallet/wallet';
import { WalletTabsProvider } from '../wallet-tabs/wallet-tabs.provider';

// Pages
import { WalletTabsChild } from '../wallet-tabs/wallet-tabs-child';
import { ConfirmPage } from './confirm/confirm';

export interface FlatWallet {
  color: string;
  name: string;
  recipientType: 'wallet';
  coin: Coin;
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
  public filteredWallets = [];
  public hasBtcWallets: boolean;
  public hasBchWallets: boolean;
  public hasContacts: boolean;
  public contactsShowMore: boolean;
  private CONTACTS_SHOW_LIMIT: number = 10;
  private currentContactsPage: number = 0;

  public amount: string;
  public fiatAmount: number;
  public fiatCode: string;
  public useSendMax: boolean;
  public invalidAddress: boolean;

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
    private txFormatProvider: TxFormatProvider,
    walletTabsProvider: WalletTabsProvider,
    private actionSheetProvider: ActionSheetProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private appProvider: AppProvider
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
    this.useSendMax = this.navParams.get('useSendMax');
    this.logger.info('ionViewDidLoad SendPage');

    this.events.subscribe('update:address', data => {
      this.search = data.value;
      this.processInput();
    });
  }

  ionViewWillEnter() {
    this.walletsBtc = this.profileProvider.getWallets({ coin: 'btc' });
    this.walletsBch = this.profileProvider.getWallets({ coin: 'bch' });
    this.hasBtcWallets = !_.isEmpty(this.walletsBtc);
    this.hasBchWallets = !_.isEmpty(this.walletsBch);
    this.walletBchList = this.getBchWalletsList();
    this.walletBtcList = this.getBtcWalletsList();
    this.updateContactsList();
  }

  ngOnDestroy() {
    this.events.unsubscribe('update:address');
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
    this.walletTabsProvider.setSendParams({
      amount: this.navParams.get('amount'),
      coin: this.navParams.get('coin'),
      useSendMax: this.useSendMax
    });
    this.walletTabsProvider.setFromPage({ fromSend: true });
    this.events.publish('ScanFromWallet');
  }

  public processInput(): void {
    if (this.search && this.search.trim() != '') {
      this.searchWallets();
      this.searchContacts();

      if (
        this.filteredContactsList.length === 0 &&
        this.filteredWallets.length === 0
      ) {
        if (
          !this.addressProvider.checkCoinAndNetwork(
            this.wallet.coin,
            this.wallet.network,
            this.search
          )
        ) {
          this.invalidAddress = true;
          if (this.wallet.coin === 'bch') this.checkIfLegacy();
        } else {
          this.invalidAddress = false;
          this.incomingDataProvider.redir(this.search, {
            amount: this.navParams.get('amount'),
            coin: this.navParams.get('coin'),
            useSendMax: this.useSendMax
          });
        }
      } else {
        this.invalidAddress = false;
      }
    } else {
      this.updateContactsList();
      this.filteredWallets = [];
    }
  }

  private checkIfLegacy() {
    let usingLegacyAddress =
      this.incomingDataProvider.isValidBitcoinCashLegacyAddress(this.search) ||
      this.incomingDataProvider.isValidBitcoinCashUriWithLegacyAddress(
        this.search
      );

    if (usingLegacyAddress) {
      let appName = this.appProvider.info.nameCase;
      const infoSheet = this.actionSheetProvider.createInfoSheet(
        'legacy-address-info',
        { appName }
      );
      infoSheet.present();
      infoSheet.onDidDismiss(option => {
        if (option) {
          let url = 'https://bitpay.github.io/address-translator/';
          this.externalLinkProvider.open(url);
        }
      });
    }
  }

  public searchWallets(): void {
    if (this.hasBchWallets && this.wallet.coin === 'bch') {
      this.filteredWallets = this.walletBchList.filter(wallet => {
        return _.includes(wallet.name.toLowerCase(), this.search.toLowerCase());
      });
    }
    if (this.hasBtcWallets && this.wallet.coin === 'btc') {
      this.filteredWallets = this.walletBtcList.filter(wallet => {
        return _.includes(wallet.name.toLowerCase(), this.search.toLowerCase());
      });
    }
  }

  public searchContacts(): void {
    this.filteredContactsList = _.filter(this.contactsList, item => {
      let val = item.name;
      return _.includes(val.toLowerCase(), this.search.toLowerCase());
    });
  }

  public goToConfirm(item): void {
    item
      .getAddress()
      .then((addr: string) => {
        if (!addr) {
          // Error is already formated
          this.popupProvider.ionicAlert('Error - no address');
          return;
        }
        this.logger.debug('Got address:' + addr + ' | ' + item.name);
        this.navCtrl.push(ConfirmPage, {
          recipientType: item.recipientType,
          amount: parseInt(this.navParams.data.amount, 10),
          toAddress: addr,
          name: item.name,
          email: item.email,
          color: item.color,
          coin: item.coin,
          network: item.network,
          useSendMax: this.useSendMax
        });
      })
      .catch(err => {
        this.logger.error('Send: could not getAddress', err);
      });
  }
}
