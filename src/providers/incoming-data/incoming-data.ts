import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// providers
import { ActionSheetProvider } from '../action-sheet/action-sheet';
import { AppProvider } from '../app/app';
import { BwcProvider } from '../bwc/bwc';
import { PayproProvider } from '../paypro/paypro';
import { Coin } from '../wallet/wallet';

export interface RedirParams {
  activePage?: any;
  amount?: string;
  coin?: Coin;
}

@Injectable()
export class IncomingDataProvider {
  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private events: Events,
    private bwcProvider: BwcProvider,
    private payproProvider: PayproProvider,
    private logger: Logger,
    private appProvider: AppProvider,
    private translate: TranslateService
  ) {
    this.logger.info('IncomingDataProvider initialized.');
  }

  public showMenu(data): void {
    const dataMenu = this.actionSheetProvider.createIncomingDataMenu({ data });
    dataMenu.present();
    dataMenu.onDidDismiss(data => this.finishIncomingData(data));
  }

  public finishIncomingData(data: any): void {
    let redirTo = null;
    let value = null;
    if (data) {
      redirTo = data.redirTo;
      value = data.value;
    }
    if (redirTo === 'AmountPage') {
      let coin = data.coin ? data.coin : 'btc';
      this.events.publish('finishIncomingDataMenuEvent', {
        redirTo,
        value,
        coin
      });
    } else {
      this.events.publish('finishIncomingDataMenuEvent', { redirTo, value });
    }
  }

  private isValidPayProNonBackwardsCompatible(data: string): boolean {
    data = this.sanitizeUri(data);
    return !!/^bitcoin(cash)?:\?r=[\w+]/.exec(data);
  }

  private isValidBitcoinUri(data: string): boolean {
    data = this.sanitizeUri(data);
    return !!this.bwcProvider.getBitcore().URI.isValid(data);
  }

  private isValidBitcoinCashUri(data: string): boolean {
    data = this.sanitizeUri(data);
    return !!this.bwcProvider.getBitcoreCash().URI.isValid(data);
  }

  public isValidBitcoinCashUriWithLegacyAddress(data: string): boolean {
    data = this.sanitizeUri(data);
    return !!this.bwcProvider
      .getBitcore()
      .URI.isValid(data.replace(/^bitcoincash:/, 'bitcoin:'));
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

  private isValidGlideraUri(data: string): boolean {
    data = this.sanitizeUri(data);
    return !!(
      data && data.indexOf(this.appProvider.info.name + '://glidera') === 0
    );
  }

  private isValidCoinbaseUri(data: string): boolean {
    data = this.sanitizeUri(data);
    return !!(
      data && data.indexOf(this.appProvider.info.name + '://coinbase') === 0
    );
  }

  private isValidBitPayCardUri(data: string): boolean {
    data = this.sanitizeUri(data);
    return !!(data && data.indexOf('bitpay://bitpay.com?secret=') === 0);
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

  private handlePrivateKey(data: string): void {
    this.logger.debug('Incoming-data: private key');
    this.showMenu({
      data,
      type: 'privateKey'
    });
  }

  private handlePayProNonBackwardsCompatible(data: string): void {
    this.logger.debug(
      'Incoming-data: Payment Protocol with non-backwards-compatible request'
    );
    let coin = data.indexOf('bitcoincash') === 0 ? Coin.BCH : Coin.BTC;
    data = decodeURIComponent(data.replace(/bitcoin(cash)?:\?r=/, ''));

    this.goToPayPro(data, coin);
  }

  private handleBitcoinUri(data: string, redirParams?: RedirParams): void {
    this.logger.debug('Incoming-data: Bitcoin URI');
    let amountFromRedirParams =
      redirParams && redirParams.amount ? redirParams.amount : '';
    const coin = Coin.BTC;
    let parsed = this.bwcProvider.getBitcore().URI(data);
    let address = parsed.address ? parsed.address.toString() : '';
    let message = parsed.message;
    let amount = parsed.amount || amountFromRedirParams;
    if (parsed.r) this.goToPayPro(data, coin);
    else this.goSend(address, amount, message, coin);
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

    if (parsed.r) this.goToPayPro(data, coin);
    else this.goSend(address, amount, message, coin);
  }

  private handleBitcoinCashUriLegacyAddress(data: string): void {
    this.logger.debug('Incoming-data: Bitcoin Cash URI with legacy address');
    const coin = Coin.BCH;
    let parsed = this.bwcProvider
      .getBitcore()
      .URI(data.replace(/^bitcoincash:/, 'bitcoin:'));

    let oldAddr = parsed.address ? parsed.address.toString() : '';
    if (!oldAddr)
      this.logger.error('Could not parse Bitcoin Cash legacy address');

    let a = this.bwcProvider
      .getBitcore()
      .Address(oldAddr)
      .toObject();
    let address = this.bwcProvider
      .getBitcoreCash()
      .Address.fromObject(a)
      .toString();
    let message = parsed.message;
    let amount = parsed.amount ? parsed.amount : '';

    // Translate address
    this.logger.warn('Legacy Bitcoin Address transalated to: ' + address);
    if (parsed.r) this.goToPayPro(data, coin);
    else this.goSend(address, amount, message, coin);
  }

  private handlePlainUrl(data: string): void {
    this.logger.debug('Incoming-data: Plain URL');
    data = this.sanitizeUri(data);
    this.showMenu({
      data,
      type: 'url'
    });
  }

  private handlePlainBitcoinAddress(
    data: string,
    redirParams?: RedirParams
  ): void {
    this.logger.debug('Incoming-data: Bitcoin plain address');
    const coin = Coin.BTC;
    if (redirParams && redirParams.activePage === 'ScanPage') {
      this.showMenu({
        data,
        type: 'bitcoinAddress',
        coin
      });
    } else if (redirParams && redirParams.amount) {
      this.goSend(data, redirParams.amount, '', coin);
    } else {
      this.goToAmountPage(data, coin);
    }
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
      this.goSend(data, redirParams.amount, '', coin);
    } else {
      this.goToAmountPage(data, coin);
    }
  }

  private goToImportByPrivateKey(data: string): void {
    this.logger.debug('Incoming-data (redirect): QR code export feature');

    let stateParams = { code: data, fromScan: true };
    let nextView = {
      name: 'ImportWalletPage',
      params: stateParams
    };
    this.events.publish('IncomingDataRedir', nextView);
  }

  private goToJoinWallet(data: string): void {
    this.logger.debug('Incoming-data (redirect): Code to join to a wallet');
    if (this.isValidJoinCode(data)) {
      let stateParams = { url: data, fromScan: true };
      let nextView = {
        name: 'JoinWalletPage',
        params: stateParams
      };
      this.events.publish('IncomingDataRedir', nextView);
    } else if (this.isValidJoinLegacyCode(data)) {
      let stateParams = { url: data, fromScan: true };
      let nextView = {
        name: 'JoinWalletPage',
        params: stateParams
      };
      this.events.publish('IncomingDataRedir', nextView);
    } else {
      this.logger.error('Incoming-data: Invalid code to join to a wallet');
    }
  }

  private goToBitPayCard(data: string): void {
    this.logger.debug('Incoming-data (redirect): BitPay Card URL');

    // Disable BitPay Card
    if (!this.appProvider.info._enabledExtensions.debitcard) {
      this.logger.warn('BitPay Card has been disabled for this build');
      return;
    }

    let secret = this.getParameterByName('secret', data);
    let email = this.getParameterByName('email', data);
    let otp = this.getParameterByName('otp', data);
    let reason = this.getParameterByName('r', data);
    switch (reason) {
      default:
      case '0':
        /* For BitPay card binding */
        let stateParams = { secret, email, otp };
        let nextView = {
          name: 'BitPayCardIntroPage',
          params: stateParams
        };
        this.events.publish('IncomingDataRedir', nextView);
        break;
    }
  }

  private goToCoinbase(data: string): void {
    this.logger.debug('Incoming-data (redirect): Coinbase URL');

    let code = this.getParameterByName('code', data);
    let stateParams = { code };
    let nextView = {
      name: 'CoinbasePage',
      params: stateParams
    };
    this.events.publish('IncomingDataRedir', nextView);
  }

  private goToGlidera(data: string): void {
    this.logger.debug('Incoming-data (redirect): Glidera URL');

    let code = this.getParameterByName('code', data);
    let stateParams = { code };
    let nextView = {
      name: 'GlideraPage',
      params: stateParams
    };
    this.events.publish('IncomingDataRedir', nextView);
  }

  public redir(data: string, redirParams?: RedirParams): boolean {
    // Payment Protocol with non-backwards-compatible request
    if (this.isValidPayProNonBackwardsCompatible(data)) {
      this.handlePayProNonBackwardsCompatible(data);
      return true;

      // Bitcoin  URI
    } else if (this.isValidBitcoinUri(data)) {
      this.handleBitcoinUri(data, redirParams);
      return true;

      // Bitcoin Cash URI
    } else if (this.isValidBitcoinCashUri(data)) {
      this.handleBitcoinCashUri(data, redirParams);
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
      this.handlePlainBitcoinAddress(data, redirParams);
      return true;

      // Plain Address (Bitcoin Cash)
    } else if (this.isValidBitcoinCashAddress(data)) {
      this.handlePlainBitcoinCashAddress(data, redirParams);
      return true;

      // Glidera
    } else if (this.isValidGlideraUri(data)) {
      this.goToGlidera(data);
      return true;

      // Coinbase
    } else if (this.isValidCoinbaseUri(data)) {
      this.goToCoinbase(data);
      return true;

      // BitPayCard Authentication
    } else if (this.isValidBitPayCardUri(data)) {
      this.goToBitPayCard(data);
      return true;

      // Join
    } else if (this.isValidJoinCode(data) || this.isValidJoinLegacyCode(data)) {
      this.goToJoinWallet(data);
      return true;

      // Check Private Key
    } else if (this.isValidPrivateKey(data)) {
      this.handlePrivateKey(data);
      return true;

      // Import Private Key
    } else if (this.isValidImportPrivateKey(data)) {
      this.goToImportByPrivateKey(data);
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
    if (this.isValidPayProNonBackwardsCompatible(data)) {
      return {
        data,
        type: 'PayPro',
        title: this.translate.instant('Payment URL')
      };

      // Bitcoin  URI
    } else if (this.isValidBitcoinUri(data)) {
      return {
        data,
        type: 'BitcoinUri',
        title: this.translate.instant('Bitcoin URI')
      };

      // Bitcoin Cash URI
    } else if (this.isValidBitcoinCashUri(data)) {
      return {
        data,
        type: 'BitcoinCashUri',
        title: this.translate.instant('Bitcoin Cash URI')
      };

      // Bitcoin Cash URI using Bitcoin Core legacy address
    } else if (this.isValidBitcoinCashUriWithLegacyAddress(data)) {
      return {
        data,
        type: 'BitcoinCashUri',
        title: this.translate.instant('Bitcoin Cash URI')
      };

      // Plain URL
    } else if (this.isValidPlainUrl(data)) {
      return {
        data,
        type: 'PlainUrl',
        title: this.translate.instant('Plain URL')
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

      // Glidera
    } else if (this.isValidGlideraUri(data)) {
      return {
        data,
        type: 'Glidera',
        title: 'Glidera URI'
      };

      // Coinbase
    } else if (this.isValidCoinbaseUri(data)) {
      return {
        data,
        type: 'Coinbase',
        title: 'Coinbase URI'
      };

      // BitPayCard Authentication
    } else if (this.isValidBitPayCardUri(data)) {
      return {
        data,
        type: 'BitPayCard',
        title: this.translate.instant('BitPay Card URI')
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

  private sanitizeUri(data): string {
    // Fixes when a region uses comma to separate decimals
    let regex = /[\?\&]amount=(\d+([\,\.]\d+)?)/i;
    let match = regex.exec(data);
    if (!match || match.length === 0) {
      return data;
    }
    let value = match[0].replace(',', '.');
    let newUri = data.replace(regex, value);

    // mobile devices, uris like copay://glidera
    newUri.replace('://', ':');

    return newUri;
  }

  private getParameterByName(name: string, url: string): string {
    if (!url) return undefined;
    name = name.replace(/[\[\]]/g, '\\$&');
    let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  private checkPrivateKey(privateKey: string): boolean {
    try {
      this.bwcProvider.getBitcore().PrivateKey(privateKey, 'livenet');
    } catch (err) {
      return false;
    }
    return true;
  }

  private goSend(
    addr: string,
    amount: string,
    message: string,
    coin: Coin
  ): void {
    if (amount) {
      let stateParams = {
        amount,
        toAddress: addr,
        description: message,
        coin
      };
      let nextView = {
        name: 'ConfirmPage',
        params: stateParams
      };
      this.events.publish('IncomingDataRedir', nextView);
    } else {
      let stateParams = {
        toAddress: addr,
        description: message,
        coin
      };
      let nextView = {
        name: 'AmountPage',
        params: stateParams
      };
      this.events.publish('IncomingDataRedir', nextView);
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
    this.events.publish('IncomingDataRedir', nextView);
  }

  private goToPayPro(url: string, coin: Coin): void {
    this.payproProvider
      .getPayProDetails(url, coin)
      .then(details => {
        this.handlePayPro(details, coin);
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  private handlePayPro(payProDetails, coin?: Coin): void {
    if (!payProDetails) {
      this.logger.error('No wallets available');
      return;
    }

    const stateParams = {
      amount: payProDetails.amount,
      toAddress: payProDetails.toAddress,
      description: payProDetails.memo,
      paypro: payProDetails,
      coin,
      requiredFeeRate: payProDetails.requiredFeeRate
        ? Math.ceil(payProDetails.requiredFeeRate * 1024)
        : undefined
    };
    const nextView = {
      name: 'ConfirmPage',
      params: stateParams
    };
    this.events.publish('IncomingDataRedir', nextView);
  }

  public getPayProDetails(data: string): Promise<any> {
    let coin: string = data.indexOf('bitcoincash') === 0 ? Coin.BCH : Coin.BTC;
    data = decodeURIComponent(data.replace(/bitcoin(cash)?:\?r=/, ''));

    let disableLoader = true;
    return this.payproProvider.getPayProDetails(data, coin, disableLoader);
  }
}
