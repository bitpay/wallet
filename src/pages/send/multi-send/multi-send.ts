import { DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  NavParams
} from 'ionic-angular';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { AddressBookProvider } from '../../../providers/address-book/address-book';
import { AddressProvider } from '../../../providers/address/address';
import { AppProvider } from '../../../providers/app/app';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { IncomingDataProvider } from '../../../providers/incoming-data/incoming-data';
import { Logger } from '../../../providers/logger/logger';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { Coin, WalletProvider } from '../../../providers/wallet/wallet';
import { WalletTabsProvider } from '../../wallet-tabs/wallet-tabs.provider';

// Pages
import { WalletTabsChild } from '../../wallet-tabs/wallet-tabs-child';
import { AmountPage } from '../amount/amount';
import { ConfirmPage } from '../confirm/confirm';
import { TransferToModalPage } from '../transfer-to-modal/transfer-to-modal';

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
  selector: 'page-multi-send',
  templateUrl: 'multi-send.html'
})
export class MultiSendPage extends WalletTabsChild {
  public search: string = '';
  public multiSearch: any = [];
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
  public amount: string;
  public fiatAmount: number;
  public fiatCode: string;
  public invalidAddress: boolean;

  private CONTACTS_SHOW_LIMIT: number = 10;
  private currentContactsPage: number = 0;
  private scannerOpened: boolean;
  private validDataTypeMap: string[] = [
    'BitcoinAddress',
    'BitcoinCashAddress',
    'BitcoinUri',
    'BitcoinCashUri'
  ];

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
    walletTabsProvider: WalletTabsProvider,
    private actionSheetProvider: ActionSheetProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private appProvider: AppProvider,
    private translate: TranslateService,
    private modalCtrl: ModalController,
    private decimalPipe: DecimalPipe
  ) {
    super(navCtrl, profileProvider, walletTabsProvider);
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: MultiSendPage');

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

  // addRecipient() {
  //   console.log('addRecipient');
  //   this.multiSearch.push({ toAddress: '', type: '' }); // Type: wallet, contact, address
  // }

  // removeRecipient() {
  //   console.log('removeRecipient');
  // }

  public openTransferToModal(): void {
    let modal = this.modalCtrl.create(
      TransferToModalPage,
      {
        wallet: this.wallet
      },
      { showBackdrop: false, enableBackdropDismiss: true }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (!data) return;
      console.log('data after modal: ', data);
    });
  }

  public openAmountModal(item, index): void {
    console.log('openAmountModal item: ', item, index);
    let modal = this.modalCtrl.create(
      AmountPage,
      {
        wallet: this.wallet
      },
      { showBackdrop: false, enableBackdropDismiss: true }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (!data) return;
      item.amount = +data.amount;
      item.fiatAmount = data.fiatAmount;
      item.fiatCode = data.fiatCode;
      item.amountToShow = this.decimalPipe.transform(
        data.amount / 1e8,
        '1.2-6'
      );

      this.multiSearch[index] = item;
      console.log('data after modal: ', this.multiSearch[index]);
    });
  }

  public addRecipient(): void {
    this.multiSearch.push({
      toAddress: _.clone(this.search),
      type: 'plain address'
    }); // Type: wallet, contact, address
    this.search = '';
    this.invalidAddress = false;
  }

  public removeRecipient(index): void {
    this.multiSearch.splice(index, 1);
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

  public shouldShowZeroState() {
    return (
      this.wallet && this.wallet.status && !this.wallet.status.totalBalanceSat
    );
  }

  public async goToReceive() {
    await this.walletTabsProvider.goToTabIndex(0);
    const coinName = this.wallet.coin === Coin.BTC ? 'bitcoin' : 'bitcoin cash';
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'receiving-bitcoin',
      { coinName }
    );
    await Observable.timer(250).toPromise();
    infoSheet.present();
  }

  public showMore(): void {
    this.currentContactsPage++;
    this.updateContactsList();
  }

  public openScanner(): void {
    this.scannerOpened = true;
    this.walletTabsProvider.setSendParams({
      amount: this.navParams.get('amount'),
      coin: this.navParams.get('coin')
    });
    this.walletTabsProvider.setFromPage({ fromSend: true });
    this.events.publish('ScanFromWallet');
  }

  private checkCoinAndNetwork(data, isPayPro?): boolean {
    let isValid;
    if (isPayPro) {
      isValid = this.addressProvider.checkCoinAndNetworkFromPayPro(
        this.wallet.coin,
        this.wallet.network,
        data
      );
    } else {
      isValid = this.addressProvider.checkCoinAndNetworkFromAddr(
        this.wallet.coin,
        this.wallet.network,
        data
      );
    }

    if (isValid) {
      this.invalidAddress = false;
      return true;
    } else {
      this.invalidAddress = true;
      let network;
      if (isPayPro) {
        network = data.network;
      } else {
        const extractedAddress = this.addressProvider.extractAddress(data);
        const addressData = this.addressProvider.validateAddress(
          extractedAddress
        );
        network = addressData.network;
      }
      if (this.wallet.coin === 'bch' && this.wallet.network === network) {
        const isLegacy = this.checkIfLegacy();
        isLegacy ? this.showLegacyAddrMessage() : this.showErrorMessage();
      } else {
        this.showErrorMessage();
      }
    }

    return false;
  }

  private redir() {
    this.incomingDataProvider.redir(this.search, {
      amount: this.navParams.get('amount'),
      coin: this.navParams.get('coin')
    });
    this.search = '';
  }

  private showErrorMessage() {
    const msg = this.translate.instant(
      'The wallet you are using does not match the network and/or the currency of the address provided'
    );
    const title = this.translate.instant('Error');
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'default-error',
      { msg, title }
    );
    infoSheet.present();
    infoSheet.onDidDismiss(() => {
      this.search = '';
    });
  }

  private showLegacyAddrMessage() {
    const appName = this.appProvider.info.nameCase;
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'legacy-address-info',
      { appName }
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
        let url =
          'https://bitpay.github.io/address-translator?addr=' + this.search;
        this.externalLinkProvider.open(url);
      }
      this.search = '';
    });
  }

  public processInput(): void {
    if (this.search && this.search.trim() != '') {
      this.searchWallets();
      this.searchContacts();

      if (
        this.filteredContactsList.length === 0 &&
        this.filteredWallets.length === 0
      ) {
        const parsedData = this.incomingDataProvider.parseData(this.search);
        if (parsedData && parsedData.type == 'PayPro') {
          this.invalidAddress = true;
        } else if (
          parsedData &&
          _.indexOf(this.validDataTypeMap, parsedData.type) != -1
        ) {
          const isValid = this.checkCoinAndNetwork(this.search);
          if (isValid) this.invalidAddress = false;
        } else {
          this.invalidAddress = true;
        }
      } else {
        this.invalidAddress = false;
      }
    } else {
      this.updateContactsList();
      this.filteredWallets = [];
    }
  }

  private checkIfLegacy(): boolean {
    return (
      this.incomingDataProvider.isValidBitcoinCashLegacyAddress(this.search) ||
      this.incomingDataProvider.isValidBitcoinCashUriWithLegacyAddress(
        this.search
      )
    );
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

  public goToConfirm(): void {
    console.log('go to Confirm Page with this data: ', this.multiSearch);
    let totalAmount = 0;
    this.multiSearch.forEach(recipient => {
      totalAmount += recipient.amount;
    });
    this.navCtrl.push(ConfirmPage, {
      fromMultiSend: true,
      totalAmount,
      recipientType: 'multi',
      color: this.wallet.color,
      coin: this.wallet.coin,
      network: this.wallet.network,
      useSendMax: false,
      recipients: this.multiSearch
    });
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
          amount: parseInt(this.navParams.data.amount, 10),
          toAddress: addr,
          name: item.name,
          email: item.email,
          color: item.color,
          coin: item.coin,
          network: item.network
        });
      })
      .catch(err => {
        this.logger.error('Send: could not getAddress', err);
      });
  }

  public closeCam(): void {
    if (this.scannerOpened) this.events.publish('ExitScan');
    else this.getParentTabs().dismiss();
    this.scannerOpened = false;
  }
}
