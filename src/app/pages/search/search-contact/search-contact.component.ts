import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, NavParams } from '@ionic/angular';
import _ from 'lodash';
import { AddressBookProvider, AppProvider, CurrencyProvider, EventManagerService, Logger, OnGoingProcessProvider, PlatformProvider, PopupProvider, ProfileProvider, WalletProvider } from 'src/app/providers';
import { Coin, CoinsMap } from 'src/app/providers/currency/currency';
import { FlatWallet } from '../../send/transfer-to/transfer-to';

@Component({
  selector: 'page-search-contact',
  templateUrl: './search-contact.component.html',
  styleUrls: ['./search-contact.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SearchContactPage implements OnInit {
  public search: string = '';
  public wallet;
  public fromSend: boolean;
  public fromMultiSend: boolean;
  public currentTheme: string;
  navParamsData;


  public wallets = {} as CoinsMap<any>;
  public hasWallets = {} as CoinsMap<boolean>;
  public walletList = {} as CoinsMap<FlatWallet[]>;
  public availableCoins: Coin[];
  public contactsList = [];
  public contactsGroup = [];
  public filteredContactsList = [];
  public filteredWallets = [];
  public walletsByKeys = [];
  public filteredWalletsByKeys = [];
  public hasContacts: boolean;
  public contactsShowMore: boolean;
  public amount: string;
  public fiatAmount: number;
  public fiatCode: string;
  public _wallet: any = {};
  public _useAsModal: boolean;
  public _fromWalletDetails: boolean;
  public hasContactsOrWallets: boolean;
  public updatingContactsList: boolean = false;
  public itemTapped: boolean = false;

  private _delayTimeOut: number = 700;

  private CONTACTS_SHOW_LIMIT: number = 10;
  private currentContactsPage: number = 0;

  public history = [];

  public listRecentTransaction = [];

  public showContactTab: boolean = false;
  constructor(
    private router: Router,
    private profileProvider: ProfileProvider,
    private navParams: NavParams,
    private viewCtrl: ModalController,
    private appProvider: AppProvider,
    private currencyProvider: CurrencyProvider,
    private walletProvider: WalletProvider,
    private addressBookProvider: AddressBookProvider,
    private logger: Logger,
    private platformProvider: PlatformProvider,
    private popupProvider: PopupProvider,
    private events: EventManagerService,
    private onGoingProcessProvider: OnGoingProcessProvider,
  ) {
    if (this.router.getCurrentNavigation()) {
      this.navParamsData = this.router.getCurrentNavigation().extras.state;
    } else {
      this.navParamsData = history ? history.state : {};
    }
    if (this.navParams && !_.isEmpty(this.navParams.data)) this.navParamsData = this.navParams.data;
    this.currentTheme = this.appProvider.themeProvider.currentAppTheme;
    this.availableCoins = this.currencyProvider.getAvailableCoins();
    for (const coin of this.availableCoins) {
      this.wallets[coin] = this.profileProvider.getWallets({ coin });
      this.hasWallets[coin] = !_.isEmpty(this.wallets[coin]);
    }
    this._delayTimeOut =
      this.platformProvider.isIOS || this.platformProvider.isAndroid
        ? 700
        : 100;
    this.handleWallet();
  }

  ngOnInit() { }

  back() {
    this.viewCtrl.dismiss({});
  }

  handleWallet() {
    this._wallet = this.navParamsData.wallet;

    for (const coin of this.availableCoins) {
      this.walletList[coin] = _.compact(this.getWalletsList(coin));
    }
    if (this._wallet.donationCoin) {
      this.walletsByKeys = _.values(
        _.groupBy(this.walletList[this._wallet.donationCoin], 'keyId')
      );
    } else {
      this.walletsByKeys = _.values(
        _.groupBy(this.walletList[this._wallet.coin], 'keyId')
      );
    }

    this.delayUpdateContactsList(this._delayTimeOut);
  }

  public getCoinName(coin: Coin) {
    return this.currencyProvider.getCoinName(coin);
  }

  private getWalletsList(coin: string): FlatWallet[] {
    return this.hasWallets[coin]
      ? this.getRelevantWallets(this.wallets[coin])
      : [];
  }

  private getRelevantWallets(rawWallets): FlatWallet[] {
    return rawWallets
      .map(wallet => this.flattenWallet(wallet))
      .filter(wallet => this.filterIrrelevantRecipients(wallet));
  }

  delayUpdateContactsList(delayTime: number = 700) {
    if (this.updatingContactsList) return;
    this.updatingContactsList = true;
    setTimeout(() => {
      this.updateContactsList();
      this.updatingContactsList = false;
    }, delayTime || 700);
  }

  private updateContactsList(): void {
    this.addressBookProvider
      .list(this._wallet ? this._wallet.network : null)
      .then(ab => {
        this.hasContacts = _.isEmpty(ab) ? false : true;
        if (!this.hasContacts) return;

        let contactsList = [];
        _.each(ab, c => {
          contactsList.push({
            name: c.name,
            address: c.address,
            network: c.network,
            email: c.email,
            recipientType: 'contact',
            coin: c.coin,
            getAddress: () => Promise.resolve(c.address),
            destinationTag: c.tag
          });
        });
        contactsList = _.orderBy(contactsList, 'name');
        this.contactsList = contactsList.filter(c =>
          this.filterIrrelevantRecipients(c)
        );
        let shortContactsList = _.clone(
          this.contactsList.slice(
            0,
            (this.currentContactsPage + 1) * this.CONTACTS_SHOW_LIMIT
          )
        );
        this.contactsShowMore =
          this.contactsList.length > shortContactsList.length;
      });
  }

  private flattenWallet(wallet): FlatWallet {
    return {
      walletId: wallet.credentials.walletId,
      color: wallet.color,
      name: wallet.name,
      lastKnownBalance: wallet.lastKnownBalance,
      cachedStatus: wallet.cachedStatus,
      recipientType: 'wallet',
      coin: wallet.coin,
      network: wallet.network,
      m: wallet.credentials.m,
      n: wallet.credentials.n,
      keyId: wallet.keyId,
      walletGroupName: wallet.walletGroupName,
      isComplete: () => wallet.isComplete(),
      needsBackup: wallet.needsBackup,
      getAddress: () => this.walletProvider.getAddress(wallet, false)
    };
  }

  private filterIrrelevantRecipients(recipient: {
    coin: string;
    network: string;
    walletId: string;
  }): boolean {
    if (this._wallet.donationCoin) {
      return this._wallet
        ? this._wallet.donationCoin === recipient.coin &&
        this._wallet.id !== recipient.walletId
        : true;
    }
    return this._wallet
      ? this._wallet.coin === recipient.coin &&
      this._wallet.network === recipient.network &&
      this._wallet.id !== recipient.walletId
      : true;
  }

  public showMore(): void {
    this.currentContactsPage++;
    this.updateContactsList();
  }

  public segmentChanged(index) {
    this.showContactTab = index === 1;
  }
  public processInput(): void {
    if (this.search && this.search.trim() != '') {
      this.searchWallets();
      this.searchContacts();

      this.hasContactsOrWallets =
        this.filteredContactsList.length === 0 &&
          this.filteredWallets.length === 0
          ? false
          : true;
    } else {
      this.delayUpdateContactsList(this._delayTimeOut);
      this.filteredWallets = [];
      this.filteredWalletsByKeys = [];
    }
  }

  public searchWallets(): void {
    for (const coin of this.availableCoins) {
      if (this.hasWallets[coin] && this._wallet.coin === coin) {
        this.filteredWallets = this.walletList[coin].filter(wallet => {
          return _.includes(
            wallet.name.toLowerCase(),
            this.search.toLowerCase()
          );
        });
        this.filteredWalletsByKeys = _.values(
          _.groupBy(this.filteredWallets, 'keyId')
        );
      }
    }
  }

  public searchContacts(): void {
    this.filteredContactsList = _.filter(this.contactsList, item => {
      let val = item.name;
      return _.includes(val.toLowerCase(), this.search.toLowerCase());
    });
  }

  public close(item): void {
    this.onGoingProcessProvider.set('Please wait...')
    this.itemTapped = true;
    item
      .getAddress()
      .then((addr: string) => {
        if (!addr) {
          // Error is already formated
          this.popupProvider.ionicAlert('Error - no address');
          return;
        }
        this.logger.debug('Got address:' + addr + ' | ' + item.name);
        this.viewCtrl.dismiss({
          recipientType: item.recipientType,
          toAddress: addr,
          name: item.name,
          email: item.email,
          id: this.navParamsData.recipientId
        });
        this.onGoingProcessProvider.clear();
      })
      .catch(err => {
        this.logger.error('Send: could not getAddress', err);
        this.onGoingProcessProvider.clear();
      });
    this.itemTapped = false;
  }

}
