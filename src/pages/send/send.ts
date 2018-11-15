import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';

// Providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AddressProvider } from '../../providers/address/address';
import { AppProvider } from '../../providers/app/app';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { IncomingDataProvider } from '../../providers/incoming-data/incoming-data';
import { Logger } from '../../providers/logger/logger';
import { ProfileProvider } from '../../providers/profile/profile';
import { Coin } from '../../providers/wallet/wallet';
import { WalletTabsProvider } from '../wallet-tabs/wallet-tabs.provider';

// Pages
import { WalletTabsChild } from '../wallet-tabs/wallet-tabs-child';
import { MultiSendPage } from './multi-send/multi-send';

@Component({
  selector: 'page-send',
  templateUrl: 'send.html'
})
export class SendPage extends WalletTabsChild {
  public search: string = '';
  public walletsBtc;
  public walletsBch;
  public hasBtcWallets: boolean;
  public hasBchWallets: boolean;
  public invalidAddress: boolean;

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
    private logger: Logger,
    private incomingDataProvider: IncomingDataProvider,
    private addressProvider: AddressProvider,
    private events: Events,
    walletTabsProvider: WalletTabsProvider,
    private actionSheetProvider: ActionSheetProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private appProvider: AppProvider,
    private translate: TranslateService
  ) {
    super(navCtrl, profileProvider, walletTabsProvider);
  }

  @ViewChild('transferTo')
  transferTo;

  ionViewDidLoad() {
    this.logger.info('Loaded: SendPage');
  }

  ionViewWillEnter() {
    this.events.subscribe('update:address', data => {
      this.search = data.value;
      this.processInput();
    });

    this.walletsBtc = this.profileProvider.getWallets({ coin: 'btc' });
    this.walletsBch = this.profileProvider.getWallets({ coin: 'bch' });
    this.hasBtcWallets = !_.isEmpty(this.walletsBtc);
    this.hasBchWallets = !_.isEmpty(this.walletsBch);
  }

  ionViewWillLeave() {
    this.events.unsubscribe('update:address');
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

  public cleanSearch() {
    this.search = '';
    this.invalidAddress = false;
  }

  public async processInput() {
    if (this.search == '') this.invalidAddress = false;
    const hasContacts = await this.checkIfContact();
    if (!hasContacts) {
      const parsedData = this.incomingDataProvider.parseData(this.search);
      if (parsedData && parsedData.type == 'PayPro') {
        const coin: string =
          this.search.indexOf('bitcoincash') === 0 ? Coin.BCH : Coin.BTC;
        this.incomingDataProvider
          .getPayProDetails(this.search)
          .then(payProDetails => {
            payProDetails.coin = coin;
            const isValid = this.checkCoinAndNetwork(payProDetails, true);
            if (isValid) this.redir();
          })
          .catch(err => {
            this.invalidAddress = true;
            this.logger.warn(err);
          });
      } else if (
        parsedData &&
        _.indexOf(this.validDataTypeMap, parsedData.type) != -1
      ) {
        const isValid = this.checkCoinAndNetwork(this.search);
        if (isValid) this.redir();
      } else {
        this.invalidAddress = true;
      }
    } else {
      this.invalidAddress = false;
    }
  }

  public async checkIfContact() {
    await Observable.timer(50).toPromise();
    return this.transferTo.hasContactsOrWallets;
  }

  private checkIfLegacy(): boolean {
    return (
      this.incomingDataProvider.isValidBitcoinCashLegacyAddress(this.search) ||
      this.incomingDataProvider.isValidBitcoinCashUriWithLegacyAddress(
        this.search
      )
    );
  }

  public goToMultiSendPage(): void {
    this.navCtrl.push(MultiSendPage);
  }

  public closeCam(): void {
    if (this.scannerOpened) this.events.publish('ExitScan');
    else this.getParentTabs().dismiss();
    this.scannerOpened = false;
  }
}
