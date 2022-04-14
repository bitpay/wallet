import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';

// providers
import { ActionSheetProvider } from '../action-sheet/action-sheet';
import { AddressProvider } from '../address/address';
import { AnalyticsProvider } from '../analytics/analytics';
import { AppProvider } from '../app/app';
import { BwcProvider } from '../bwc/bwc';
import { Coin, CurrencyProvider } from '../currency/currency';
import { EventManagerService } from '../event-manager.service';
import { Logger } from '../logger/logger';
import { PersistenceProvider } from '../persistence/persistence';
import { ProfileProvider } from '../profile/profile';

export interface RedirParams {
  activePage?: any;
  amount?: string;
  coin?: Coin;
  token?: any,
  fromHomeCard?: boolean;
  fromFooterMenu?: boolean;
  recipientId?: number;
}
@Injectable({
  providedIn: 'root'
})
export class IncomingDataProvider {
  private activePage: string;
  private fromFooterMenu: boolean;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private events: EventManagerService,
    private bwcProvider: BwcProvider,
    public currencyProvider: CurrencyProvider,
    private logger: Logger,
    private analyticsProvider: AnalyticsProvider,
    private appProvider: AppProvider,
    private translate: TranslateService,
    private profileProvider: ProfileProvider,
    private persistenceProvider: PersistenceProvider,
    private addressProvider: AddressProvider
  ) {
    this.logger.debug('IncomingDataProvider initialized');
  }

  public showMenu(data): void {
    const dataMenu = this.actionSheetProvider.createIncomingDataMenu({ data });
    dataMenu.present();
    dataMenu.onDidDismiss(data => this.finishIncomingData(data));
  }

  public finishIncomingData(data: any): void {
    let nextView: any = {};
    if (data) {
      const stateParams = {
        addressbookEntry:
          data.redirTo == 'AddressbookAddPage' ? data.value : null,
        toAddress: data.redirTo == 'AmountPage' ? data.value : null,
        coin: data.coin ? data.coin : 'btc',
        privateKey: data.redirTo == 'PaperWalletPage' ? data.value : null
      };
      nextView = {
        name: data.redirTo,
        params: stateParams
      };
    }
    nextView.params.fromFooterMenu = this.fromFooterMenu;
    this.incomingDataRedir(nextView);
  }

  private isValidBitcoinUri(data: string): boolean {
    data = this.sanitizeUri(data);
    return !!this.bwcProvider.getBitcore().URI.isValid(data);
  }

  private isValidBitcoinCashUri(data: string): boolean {
    data = this.sanitizeUri(data);
    return !!this.bwcProvider.getBitcoreCash().URI.isValid(data);
  }

  private isValidEToken(data: string): boolean {
    try {
      const { prefix, type, hash } = this.addressProvider.decodeAddress(data);
      const ecassAddess = this.addressProvider.encodeAddress('ecash', type, hash, data);
      return this.isValidECashUri(ecassAddess);
    } catch (err) {
      return false
    }
  }

  private isValidECashUri(data: string): boolean {
    data = this.sanitizeUri(data);
    return !!this.bwcProvider.getBitcoreXec().URI.isValid(data);
  }

  private isValidLotusUri(data: string): boolean {
    data = this.sanitizeUri(data);
    return !!this.bwcProvider.getBitcoreXpi().URI.isValid(data);
  }

  private isValidDogecoinUri(data: string): boolean {
    data = this.sanitizeUri(data);
    return !!this.bwcProvider.getBitcoreDoge().URI.isValid(data);
  }

  private isValidLitecoinUri(data: string): boolean {
    data = this.sanitizeUri(data);
    return !!this.bwcProvider.getBitcoreLtc().URI.isValid(data);
  }

  private isValidWalletConnectUri(data: string): boolean {
    return !!/^(wc)?:/.exec(data);
  }

  public isValidBitcoinCashUriWithLegacyAddress(data: string): boolean {
    data = this.sanitizeUri(data);
    return !!this.bwcProvider
      .getBitcore()
      .URI.isValid(data.replace(/^(bitcoincash:|bchtest:)/, 'bitcoin:'));
  }

  private isValidPlainUrl(data: string): boolean {
    data = this.sanitizeUri(data);
    return !!/^https?:\/\//.test(data);
  }

  private isValidBitcoinAddress(data: string): boolean {
    return !!(
      this.bwcProvider.getBitcore().Address.isValid(data, 'livenet') ||
      this.bwcProvider.getBitcore().Address.isValid(data, 'testnet')
    );
  }

  public isValidBitcoinCashLegacyAddress(data: string): boolean {
    return !!(
      this.bwcProvider.getBitcore().Address.isValid(data, 'livenet') ||
      this.bwcProvider.getBitcore().Address.isValid(data, 'testnet')
    );
  }

  private isValidBitcoinCashAddress(data: string): boolean {
    return !!(
      this.bwcProvider.getBitcoreCash().Address.isValid(data, 'livenet') ||
      this.bwcProvider.getBitcoreCash().Address.isValid(data, 'testnet')
    );
  }

  private isValidECashAddress(data: string): boolean {
    return !!(
      this.bwcProvider.getBitcoreXec().Address.isValid(data, 'livenet') ||
      this.bwcProvider.getBitcoreXec().Address.isValid(data, 'testnet')
    );
  }

  private isValidLotusAddress(data: string): boolean {
    return !!(
      this.bwcProvider.getBitcoreXpi().Address.isValid(data, 'livenet') ||
      this.bwcProvider.getBitcoreXpi().Address.isValid(data, 'testnet')
    );
  }

  private isValidDogecoinAddress(data: string): boolean {
    return !!(
      this.bwcProvider.getBitcoreDoge().Address.isValid(data, 'livenet') ||
      this.bwcProvider.getBitcoreDoge().Address.isValid(data, 'testnet')
    );
  }

  private isValidLitecoinAddress(data: string): boolean {
    return !!(
      this.bwcProvider.getBitcoreLtc().Address.isValid(data, 'livenet') ||
      this.bwcProvider.getBitcoreLtc().Address.isValid(data, 'testnet')
    );
  }

  private isValidJoinCode(data: string): boolean {
    data = this.sanitizeUri(data);
    return !!(data && data.match(/^copay:[0-9A-HJ-NP-Za-km-z]{70,80}$/));
  }

  private isValidJoinLegacyCode(data: string): boolean {
    return !!(data && data.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/));
  }

  private isValidPrivateKey(data: string): boolean {
    return !!(
      data &&
      (data.substring(0, 2) == '6P' || this.checkPrivateKey(data))
    );
  }

  private isValidImportPrivateKey(data: string): boolean {
    return !!(
      data &&
      (data.substring(0, 2) == '1|' ||
        data.substring(0, 2) == '2|' ||
        data.substring(0, 2) == '3|')
    );
  }

  private handlePrivateKey(data: string, redirParams?: RedirParams): void {
    this.logger.debug('Incoming-data: private key');
    this.showMenu({
      data,
      type: 'privateKey',
      fromHomeCard: redirParams ? redirParams.fromHomeCard : false
    });
  }

  private handleBitcoinCashUri(data: string, redirParams?: RedirParams): void {
    this.logger.debug('Incoming-data: Bitcoin Cash URI');
    let amountFromRedirParams =
      redirParams && redirParams.amount ? redirParams.amount : '';
    const coin = Coin.BCH;
    let parsed = this.bwcProvider.getBitcoreCash().URI(data);
    let address = parsed.address ? parsed.address.toString() : '';

    // keep address in original format
    if (parsed.address && data.indexOf(address) < 0) {
      address = parsed.address.toCashAddress();
    }

    let message = parsed.message;
    let amount = parsed.amount || amountFromRedirParams;

    if (parsed.r) {
    } else this.goSend(address, amount, message, coin, redirParams.recipientId);
  }

  private handleEtoken(data: string, redirParams?: RedirParams) {
    this.logger.debug('Incoming-data: Etoken');
    let amountFromRedirParams =
      redirParams && redirParams.amount ? redirParams.amount : '';
    const coin = Coin.XEC;
    let amount = amountFromRedirParams;
    this.goSend(data, amount, null, coin, redirParams.recipientId, null, null, redirParams.token);
  }

  private handleECashUri(data: string, redirParams?: RedirParams): void {
    this.logger.debug('Incoming-data: ECash URI');
    let amountFromRedirParams =
      redirParams && redirParams.amount ? redirParams.amount : '';
    const coin = Coin.XEC;
    let parsed = this.bwcProvider.getBitcoreXec().URI(data);
    let address = parsed.address ? parsed.address.toString() : '';

    // keep address in original format
    if (parsed.address && data.indexOf(address) < 0) {
      address = parsed.address.toCashAddress();
    }

    let message = parsed.message;
    let amount = parsed.amount || amountFromRedirParams;

    if (parsed.r) {
    } else this.goSend(address, amount, message, coin, redirParams.recipientId);
  }

  private handleLotusUri(data: string, redirParams?: RedirParams): void {
    this.logger.debug('Incoming-data: Lotus URI');
    let amountFromRedirParams = redirParams && redirParams.amount ? redirParams.amount : '';
    const coin = Coin.XPI;
    const bitcoreXpi: any = this.bwcProvider.getBitcoreXpi();
    let parsed = bitcoreXpi.URI(data);
    let address = parsed.address ? parsed.address.toString() : '';

    // keep address in original format
    if (parsed.address && data.indexOf(address) < 0) {
      address = parsed.address.toCashAddress();
    }
    let message = parsed.message;
    let amount = parsed.amount || amountFromRedirParams;
    this.logger.debug(amount);
    this.logger.debug(redirParams.recipientId);
    if (parsed.r) {
    } else this.goSend(address, amount, message, coin, redirParams.recipientId);
  }

  private handleDogecoinUri(data: string, redirParams?: RedirParams): void {
    this.logger.debug('Incoming-data: Dogecoin URI');
    let amountFromRedirParams =
      redirParams && redirParams.amount ? redirParams.amount : '';
    const coin = Coin.DOGE;
    let parsed = this.bwcProvider.getBitcoreDoge().URI(data);
    let address = parsed.address ? parsed.address.toString() : '';
    let message = parsed.message;
    let amount = parsed.amount || amountFromRedirParams;
    if (parsed.r) {
    } else this.goSend(address, amount, message, coin, redirParams.recipientId);
  }

  private handleLitecoinUri(data: string, redirParams?: RedirParams): void {
    this.logger.debug('Incoming-data: Litecoin URI');
    let amountFromRedirParams =
      redirParams && redirParams.amount ? redirParams.amount : '';
    const coin = Coin.LTC;
    let parsed = this.bwcProvider.getBitcoreLtc().URI(data);
    let address = parsed.address ? parsed.address.toString() : '';
    let message = parsed.message;
    let amount = parsed.amount || amountFromRedirParams;
    if (parsed.r) {
    } else this.goSend(address, amount, message, coin, redirParams.recipientId);
  }

  private handleWalletConnectUri(uri: string): void {
    // Disable Wallet Connect
    if (!this.appProvider.info._enabledExtensions.walletConnect) {
      this.logger.warn('Wallet Connect has been disabled for this build');
      return;
    }

    let stateParams = {
      uri
    };
    let nextView = {
      name: 'WalletConnectPage',
      params: stateParams
    };

    this.analyticsProvider.logEvent('wallet_connect_camera_scan_attempt', {});
    this.incomingDataRedir(nextView);
  }

  private handleBitcoinCashUriLegacyAddress(data: string): void {
    this.logger.debug('Incoming-data: Bitcoin Cash URI with legacy address');
    const coin = Coin.BCH;
    let parsed = this.bwcProvider
      .getBitcore()
      .URI(data.replace(/^(bitcoincash:|bchtest:)/, 'bitcoin:'));

    let oldAddr = parsed.address ? parsed.address.toString() : '';
    if (!oldAddr)
      this.logger.error('Could not parse Bitcoin Cash legacy address');

    let a = this.bwcProvider.getBitcore().Address(oldAddr).toObject();
    let address = this.bwcProvider
      .getBitcoreCash()
      .Address.fromObject(a)
      .toString();
    let message = parsed.message;
    let amount = parsed.amount ? parsed.amount : '';

    // Translate address
    this.logger.warn('Legacy Bitcoin Address translated to: ' + address);
    if (parsed.r) {
    } else this.goSend(address, amount, message, coin);
  }

  // Deprecated
  private handlePlainUrl(data: string): void {
    this.logger.debug('Incoming-data: Plain URL', data);
    // No process Plain URL anymore
    // data = this.sanitizeUri(data);
    // this.showMenu({
    //  data,
    //  type: 'url'
    // });
  }

  private handlePlainBitcoinCashAddress(
    data: string,
    redirParams?: RedirParams
  ): void {
    this.logger.debug('Incoming-data: Bitcoin Cash plain address');
    const coin = Coin.BCH;
    if (redirParams && redirParams.activePage === 'ScanPage') {
      this.showMenu({
        data,
        type: 'bitcoinAddress',
        coin
      });
    } else if (redirParams && redirParams.amount) {
      this.goSend(data, redirParams.amount, '', coin, redirParams.recipientId);
    } else {
      this.goToAmountPage(data, coin);
    }
  }

  private handlePlainDogecoinAddress(
    data: string,
    redirParams?: RedirParams
  ): void {
    this.logger.debug('Incoming-data: Dogecoin plain address');
    const coin = Coin.DOGE;
    if (redirParams && redirParams.activePage === 'ScanPage') {
      this.showMenu({
        data,
        type: 'dogecoinAddress',
        coin
      });
    } else if (redirParams && redirParams.amount) {
      this.goSend(data, redirParams.amount, '', coin, redirParams.recipientId);
    } else {
      this.goToAmountPage(data, coin);
    }
  }

  private handlePlainLitecoinAddress(
    data: string,
    redirParams?: RedirParams
  ): void {
    this.logger.debug('Incoming-data: Litecoin plain address');
    const coin = Coin.LTC;
    if (redirParams && redirParams.activePage === 'ScanPage') {
      this.showMenu({
        data,
        type: 'litecoinAddress',
        coin
      });
    } else if (redirParams && redirParams.amount) {
      this.goSend(data, redirParams.amount, '', coin, redirParams.recipientId);
    } else {
      this.goToAmountPage(data, coin);
    }
  }

  private handlePlainLotusAddress(
    data: string,
    redirParams?: RedirParams
  ): void {
    this.logger.debug('Incoming-data: Lotus plain address');
    const coin = Coin.XPI;
    if (redirParams && redirParams.activePage === 'ScanPage') {
      this.showMenu({
        data,
        type: 'lotusAddress',
        coin
      });
    } else if (redirParams && redirParams.amount) {
      this.goSend(data, redirParams.amount, '', coin, redirParams.recipientId);
    } else {
      this.goToAmountPage(data, coin);
    }
  }

  private handlePlainEcashAddress(
    data: string,
    redirParams?: RedirParams
  ): void {
    this.logger.debug('Incoming-data: ECash plain address');
    const coin = Coin.XEC;
    if (redirParams && redirParams.activePage === 'ScanPage') {
      this.showMenu({
        data,
        type: 'ecashAddress',
        coin
      });
    } else if (redirParams && redirParams.amount) {
      this.goSend(data, redirParams.amount, '', coin, redirParams.recipientId);
    } else {
      this.goToAmountPage(data, coin);
    }
  }

  private goToImportByPrivateKey(data: string): void {
    this.logger.debug('Incoming-data (redirect): QR code export feature');

    let stateParams = { code: data };
    let nextView = {
      name: 'ImportWalletPage',
      params: stateParams
    };
    this.incomingDataRedir(nextView);
  }

  private goToJoinWallet(data: string): void {
    this.logger.debug('Incoming-data (redirect): Code to join to a wallet');
    let nextView, stateParams;

    const opts = {
      showHidden: true,
      canAddNewAccount: true
    };
    const wallets = this.profileProvider.getWallets(opts);
    const nrKeys = _.values(_.groupBy(wallets, 'keyId')).length;

    if (nrKeys === 0) {
      stateParams = { url: data };
      nextView = {
        name: 'JoinWalletPage',
        params: stateParams
      };
    } else if (nrKeys != 1) {
      stateParams = { url: data, isJoin: true };
      nextView = {
        name: 'AddWalletPage',
        params: stateParams
      };
    } else if (nrKeys === 1) {
      stateParams = { keyId: wallets[0].credentials.keyId, url: data };
      nextView = {
        name: 'JoinWalletPage',
        params: stateParams
      };
    }

    if (this.isValidJoinCode(data) || this.isValidJoinLegacyCode(data)) {
      this.incomingDataRedir(nextView);
    } else {
      this.logger.error('Incoming-data: Invalid code to join to a wallet');
    }
  }

  public redir(data: string, redirParams?: RedirParams): boolean {
    if (redirParams && redirParams.activePage)
      this.activePage = redirParams.activePage;
    if (redirParams && redirParams.activePage)
      this.fromFooterMenu = redirParams.fromFooterMenu;
    if (redirParams.token) {
      if (this.isValidEToken(data)) {
        this.handleEtoken(data, redirParams);
        return true;
      }
      this.logger.warn('Incoming-data: Unknown information');
      return false;
    }
    // Bitcoin  URI
    else if (this.isValidBitcoinUri(data)) {
      // this.handleBitcoinUri(data, redirParams);
      return true;

      // Bitcoin Cash URI
    } else if (this.isValidBitcoinCashUri(data)) {
      this.handleBitcoinCashUri(data, redirParams);
      return true;

      // Ecash URI
    } else if (this.isValidECashUri(data)) {
      this.handleECashUri(data, redirParams);
      return true;

      // Lotus URI
    } else if (this.isValidLotusUri(data)) {
      this.handleLotusUri(data, redirParams);
      return true;

      // Dogecoin URI
    } else if (this.isValidDogecoinUri(data)) {
      this.handleDogecoinUri(data, redirParams);
      return true;

      // Litecoin URI
    } else if (this.isValidLitecoinUri(data)) {
      this.handleLitecoinUri(data, redirParams);
      return true;

      // Wallet Connect URI
    } else if (this.isValidWalletConnectUri(data)) {
      this.handleWalletConnectUri(data);
      return true;

      // Bitcoin Cash URI using Bitcoin Core legacy address
    } else if (this.isValidBitcoinCashUriWithLegacyAddress(data)) {
      this.handleBitcoinCashUriLegacyAddress(data);
      return true;

      // Plain URL
    } else if (this.isValidPlainUrl(data)) {
      this.handlePlainUrl(data);
      return true;

      // Plain Address (Bitcoin)
    } else if (this.isValidBitcoinAddress(data)) {
      // this.handlePlainBitcoinAddress(data, redirParams);
      return true;

      // Plain Address (Bitcoin Cash)
    } else if (this.isValidBitcoinCashAddress(data)) {
      this.handlePlainBitcoinCashAddress(data, redirParams);
      return true;

      // Plain Address (Doge)
    } else if (this.isValidDogecoinAddress(data)) {
      this.handlePlainDogecoinAddress(data, redirParams);
      return true;

      // Plain Address (Litecoin)
    } else if (this.isValidLitecoinAddress(data)) {
      this.handlePlainLitecoinAddress(data, redirParams);
      return true;

      // Plain Address (Lotuscoin)
    } else if (this.isValidLotusAddress(data)) {
      this.handlePlainLotusAddress(data, redirParams);
      return true;

      // Plain Address (Ecashcoin)
    } else if (this.isValidECashAddress(data)) {
      this.handlePlainEcashAddress(data, redirParams);
      return true;

      // Join
    } else if (this.isValidJoinCode(data) || this.isValidJoinLegacyCode(data)) {
      this.goToJoinWallet(data);
      return true;

      // Check Private Key
    } else if (this.isValidPrivateKey(data)) {
      this.handlePrivateKey(data, redirParams);
      return true;

      // Import Private Key
    } else if (this.isValidImportPrivateKey(data)) {
      this.goToImportByPrivateKey(data);
      return true;
    } else if (data.includes('wallet-card')) {
      const event = data.split('wallet-card/')[1];
      const [switchExp, payload] = (event || '').split('?');

      /*
       *
       * handler for wallet-card events
       *
       * leaving this as a switch in case events become complex and require wallet side and iab actions
       *
       * */
      switch (switchExp) {
        case 'pairing':
          const secret = payload.split('=')[1].split('&')[0];
          const params = {
            secret,
            withNotification: true
          };
          if (payload.includes('&code=')) {
            params['code'] = payload.split('&code=')[1];
          }

          if (payload.includes('dashboardRedirect')) {
            params['dashboardRedirect'] = true;
          }

          // this param is set if pairing for the first time after an order
          if (payload.includes('fb=orderComplete')) {
            this.persistenceProvider.getNetwork().then(network => {
              if (network === 'livenet') {
                this.analyticsProvider.logEvent('Card_application_Success', {});
              }
            });
          }
          break;

        case 'order-now':
          this.persistenceProvider.setCardExperimentFlag('enabled');

          this.events.publish('experimentUpdateStart');
          setTimeout(() => {
            this.events.publish('experimentUpdateComplete');
          }, 300);

          break;
      }

      return true;
      // Anything else
    } else {
      if (redirParams && redirParams.activePage === 'ScanPage') {
        this.logger.debug('Incoming-data: Plain text');
        this.showMenu({
          data,
          type: 'text'
        });
        return true;
      } else {
        this.logger.warn('Incoming-data: Unknown information');
        return false;
      }
    }
  }

  public parseData(data: string): any {
    if (!data) return;

    // Bitcoin URI
    if (this.isValidBitcoinUri(data)) {
      return {
        data,
        type: 'BitcoinUri',
        title: 'Bitcoin URI'
      };

      // Bitcoin Cash URI
    } else if (this.isValidBitcoinCashUri(data)) {
      return {
        data,
        type: 'BitcoinCashUri',
        title: 'Bitcoin Cash URI'
      };

      // Dogecoin URI
    } else if (this.isValidDogecoinUri(data)) {
      return {
        data,
        type: 'DogecoinUri',
        title: 'Dogecoin URI'
      };
      // Litecoin URI
    } else if (this.isValidLitecoinUri(data)) {
      return {
        data,
        type: 'LitecoinUri',
        title: 'Litecoin URI'
      };
      // Ecash URI
    } else if (this.isValidECashUri(data)) {
      return {
        data,
        type: 'ECashUri',
        title: 'Ecash URI'
      };
      // Lotus URI
    } else if (this.isValidLotusUri(data)) {
      return {
        data,
        type: 'LotusUri',
        title: 'Lotus URI'
      };
      // Wallet Connect URI
    } else if (this.isValidWalletConnectUri(data)) {
      return {
        data,
        type: 'WalletConnectUri',
        title: 'WalletConnect URI'
      };

      // Bitcoin Cash URI using Bitcoin Core legacy address
    } else if (this.isValidBitcoinCashUriWithLegacyAddress(data)) {
      return {
        data,
        type: 'BitcoinCashUri',
        title: 'Bitcoin Cash URI'
      };

      // Plain URL
    } else if (this.isValidPlainUrl(data)) {
      return {
        data,
        type: 'PlainUrl',
        title: 'Plain URL'
      };

      // Plain Address (Bitcoin)
    } else if (this.isValidBitcoinAddress(data)) {
      return {
        data,
        type: 'BitcoinAddress',
        title: this.translate.instant('Bitcoin Address')
      };

      // Plain Address (Bitcoin Cash)
    } else if (this.isValidBitcoinCashAddress(data)) {
      return {
        data,
        type: 'BitcoinCashAddress',
        title: this.translate.instant('Bitcoin Cash Address')
      };

      // Plain Address (Ecash)
    } else if (this.isValidECashAddress(data)) {
      return {
        data,
        type: 'ECashAddress',
        title: this.translate.instant('ECash Address')
      };

      // Plain Address (Ethereum)
    } else if (this.isValidLotusAddress(data)) {
      return {
        data,
        type: 'LotusAddress',
        title: this.translate.instant('Lotus Address')
      };

      // Plain Address (Dogecoin)
    } else if (this.isValidDogecoinAddress(data)) {
      return {
        data,
        type: 'DogecoinAddress',
        title: this.translate.instant('Doge Address')
      };

      // Plain Address (Litecoin)
    } else if (this.isValidLitecoinAddress(data)) {
      return {
        data,
        type: 'LitecoinAddress',
        title: this.translate.instant('Litecoin Address')
      };

      // Join
    } else if (this.isValidJoinCode(data) || this.isValidJoinLegacyCode(data)) {
      return {
        data,
        type: 'JoinWallet',
        title: this.translate.instant('Invitation Code')
      };

      // Check Private Key
    } else if (this.isValidPrivateKey(data)) {
      return {
        data,
        type: 'PrivateKey',
        title: this.translate.instant('Private Key')
      };

      // Import Private Key
    } else if (this.isValidImportPrivateKey(data)) {
      return {
        data,
        type: 'ImportPrivateKey',
        title: this.translate.instant('Import Words')
      };

      // Anything else
    } else {
      return;
    }
  }

  public extractAddress(data: string): string {
    const address = data.replace(/^[a-z]+:/i, '').replace(/\?.*/, '');
    const params = /([\?\&]+[a-z]+=(\d+([\,\.]\d+)?))+/i;
    return address.replace(params, '');
  }

  private sanitizeUri(data): string {
    // Fixes when a region uses comma to separate decimals
    let regex = /[\?\&]amount=(\d+([\,\.]\d+)?)/i;
    let match = regex.exec(data);
    if (!match || match.length === 0) {
      return data;
    }
    let value = match[0].replace(',', '.');
    let newUri = data.replace(regex, value);

    // mobile devices, uris like copay://xxx
    newUri.replace('://', ':');

    return newUri;
  }

  public getParameterByName(name: string, url: string): string {
    if (!url) return undefined;
    name = name.replace(/[\[\]]/g, '\\$&');
    let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  private checkPrivateKey(privateKey: string): boolean {
    // Check if it is a Transaction id to prevent errors
    let isPK: boolean = this.checkRegex(privateKey);
    if (!isPK) return false;
    try {
      this.bwcProvider.getBitcore().PrivateKey(privateKey, 'livenet');
    } catch (err) {
      return false;
    }
    return true;
  }

  private checkRegex(data: string): boolean {
    let PKregex = new RegExp(/^[5KL][1-9A-HJ-NP-Za-km-z]{50,51}$/);
    return !!PKregex.exec(data);
  }

  private goSend(
    addr: string,
    amount: string,
    message: string,
    coin: Coin,
    recipientId?: number,
    requiredFeeRate?: string,
    destinationTag?: string,
    token?: any
  ): void {
    if (amount && !recipientId) {
      let stateParams = {
        amount,
        toAddress: addr,
        description: message,
        coin,
        requiredFeeRate,
        destinationTag
      };
      let nextView = {
        name: 'ConfirmPage',
        params: stateParams
      };
      this.incomingDataRedir(nextView);
    }
    else if (amount && recipientId) {
      this.logger.debug('go Send');

      let stateParams = {
        amount,
        toAddress: addr,
        description: message,
        coin,
        requiredFeeRate,
        destinationTag,
        recipientId
      };
      let nextView = {
        name: 'SendPage',
        params: stateParams
      };
      this.incomingDataRedir(nextView);
    }
    else {
      let stateParams = {
        toAddress: addr,
        description: message,
        coin,
        token
      };
      let nextView = {
        name: 'SendPage',
        params: stateParams
      };
      this.incomingDataRedir(nextView);
    }
  }

  private goToAmountPage(toAddress: string, coin: Coin): void {
    let stateParams = {
      toAddress,
      coin
    };
    let nextView = {
      name: 'AmountPage',
      params: stateParams
    };
    this.incomingDataRedir(nextView);
  }

  private incomingDataRedir(nextView) {
    if (this.activePage === 'SendPage') {
      this.events.publish('SendPageRedir', nextView);
    } else {
      this.events.publish('IncomingDataRedir', nextView);
    }
  }
}
