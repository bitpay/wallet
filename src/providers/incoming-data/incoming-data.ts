import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// providers
import { AppProvider } from '../app/app';
import { BwcProvider } from '../bwc/bwc';
import { PayproProvider } from '../paypro/paypro';
import { PopupProvider } from '../popup/popup';
import { Coin } from '../wallet/wallet';

export interface RedirParams {
  activePage?: any;
  amount?: string;
  coin?: Coin;
  useSendMax?: boolean;
}

@Injectable()
export class IncomingDataProvider {
  constructor(
    private events: Events,
    private bwcProvider: BwcProvider,
    private payproProvider: PayproProvider,
    private popupProvider: PopupProvider,
    private logger: Logger,
    private appProvider: AppProvider,
    private translate: TranslateService
  ) {
    this.logger.info('IncomingDataProvider initialized.');
  }

  public showMenu(data): void {
    this.events.publish('showIncomingDataMenuEvent', data);
  }

  public redir(data: string, redirParams?: RedirParams): boolean {
    const useSendMax = redirParams && redirParams.useSendMax ? true : false;
    // data extensions for Payment Protocol with non-backwards-compatible request
    if (/^bitcoin(cash)?:\?r=[\w+]/.exec(data)) {
      this.logger.debug(
        'Handling Payment Protocol with non-backwards-compatible request'
      );

      let coin = data.indexOf('bitcoincash') === 0 ? Coin.BCH : Coin.BTC;

      data = decodeURIComponent(data.replace(/bitcoin(cash)?:\?r=/, ''));

      this.payproProvider
        .getPayProDetails(data, coin)
        .then(details => {
          this.handlePayPro(details, coin);
        })
        .catch(err => {
          this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
        });

      return true;
    }

    data = this.sanitizeUri(data);
    let amount: string;
    let message: string;
    let addr: string;
    let parsed;
    let coin: Coin;

    // Bitcoin  URL
    if (this.bwcProvider.getBitcore().URI.isValid(data)) {
      this.logger.debug('Handling Bitcoin URI');
      coin = Coin.BTC;
      parsed = this.bwcProvider.getBitcore().URI(data);
      addr = parsed.address ? parsed.address.toString() : '';
      message = parsed.message;
      amount = parsed.amount || redirParams.amount || '';

      if (parsed.r) {
        this.payproProvider
          .getPayProDetails(parsed.r, coin)
          .then(details => {
            this.handlePayPro(details, coin);
          })
          .catch((err: string) => {
            addr && amount
              ? this.goSend(addr, amount, message, coin, useSendMax)
              : this.popupProvider.ionicAlert(
                  this.translate.instant('Error'),
                  err
                );
          });
      } else {
        this.goSend(addr, amount, message, coin, useSendMax);
      }
      return true;
      // Cash URI
    } else if (this.bwcProvider.getBitcoreCash().URI.isValid(data)) {
      this.logger.debug('Handling Bitcoin Cash URI');
      coin = Coin.BCH;
      parsed = this.bwcProvider.getBitcoreCash().URI(data);
      addr = parsed.address ? parsed.address.toString() : '';

      // keep address in original format
      if (parsed.address && data.indexOf(addr) < 0) {
        addr = parsed.address.toCashAddress();
      }

      message = parsed.message;
      amount = parsed.amount || redirParams.amount || '';

      if (parsed.r) {
        this.payproProvider
          .getPayProDetails(parsed.r, coin)
          .then(details => {
            this.handlePayPro(details, coin);
          })
          .catch((err: string) => {
            addr && amount
              ? this.goSend(addr, amount, message, coin, useSendMax)
              : this.popupProvider.ionicAlert(
                  this.translate.instant('Error'),
                  err
                );
          });
      } else {
        this.goSend(addr, amount, message, coin, useSendMax);
      }
      return true;

      // Cash URI with bitcoin core address version number?
    } else if (
      this.bwcProvider
        .getBitcore()
        .URI.isValid(data.replace(/^bitcoincash:/, 'bitcoin:'))
    ) {
      this.logger.debug('Handling Bitcoin Cash URI with legacy address');
      coin = Coin.BCH;
      parsed = this.bwcProvider
        .getBitcore()
        .URI(data.replace(/^bitcoincash:/, 'bitcoin:'));

      let oldAddr = parsed.address ? parsed.address.toString() : '';
      if (!oldAddr) return false;

      addr = '';

      let a = this.bwcProvider
        .getBitcore()
        .Address(oldAddr)
        .toObject();
      addr = this.bwcProvider
        .getBitcoreCash()
        .Address.fromObject(a)
        .toString();

      // Translate address
      this.logger.debug('address transalated to:' + addr);
      let title = this.translate.instant('Bitcoin cash Payment');
      let msg = this.translate.instant(
        'Payment address was translated to new Bitcoin Cash address format: {{addr}}',
        { addr }
      );
      this.popupProvider.ionicConfirm(title, msg).then((res: boolean) => {
        if (!res) return false;

        message = parsed.message;
        amount = parsed.amount ? parsed.amount : '';

        if (parsed.r) {
          this.payproProvider
            .getPayProDetails(parsed.r, coin)
            .then(details => {
              this.handlePayPro(details, coin);
            })
            .catch(err => {
              addr && amount
                ? this.goSend(addr, amount, message, coin, useSendMax)
                : this.popupProvider.ionicAlert(
                    this.translate.instant('Error'),
                    err
                  );
            });
        } else {
          this.goSend(addr, amount, message, coin, useSendMax);
        }
        return undefined;
      });
      return true;
    } else if (/^https?:\/\//.test(data)) {
      // Plain URL
      this.logger.debug('Handling Plain URL');

      let coin = Coin.BTC; // Assume BTC

      this.payproProvider
        .getPayProDetails(data, coin, true)
        .then(details => {
          this.handlePayPro(details, coin);
        })
        .catch(() => {
          this.showMenu({
            data,
            type: 'url'
          });
        });
      return true;
      // Plain Address
    } else if (
      this.bwcProvider.getBitcore().Address.isValid(data, 'livenet') ||
      this.bwcProvider.getBitcore().Address.isValid(data, 'testnet')
    ) {
      this.logger.debug('Handling Bitcoin Plain Address');
      const coin = Coin.BTC;
      if (redirParams.activePage === 'ScanPage') {
        this.showMenu({
          data,
          type: 'bitcoinAddress',
          coin
        });
      } else if (redirParams && redirParams.amount) {
        this.goSend(data, redirParams.amount, '', coin, useSendMax);
      } else {
        this.goToAmountPage(data, coin);
      }
      return true;
    } else if (
      this.bwcProvider.getBitcoreCash().Address.isValid(data, 'livenet') ||
      this.bwcProvider.getBitcoreCash().Address.isValid(data, 'testnet')
    ) {
      this.logger.debug('Handling Bitcoin Cash Plain Address');
      const coin = Coin.BCH;
      if (redirParams.activePage === 'ScanPage') {
        this.showMenu({
          data,
          type: 'bitcoinAddress',
          coin: 'bch'
        });
      } else if (redirParams && redirParams.amount) {
        this.goSend(data, redirParams.amount, '', coin, useSendMax);
      } else {
        this.goToAmountPage(data, coin);
      }
      return true;
    } else if (
      data &&
      data.indexOf(this.appProvider.info.name + '://glidera') === 0
    ) {
      this.logger.debug('Handling Glidera URL');

      let code = this.getParameterByName('code', data);
      let stateParams = { code };
      let nextView = {
        name: 'GlideraPage',
        params: stateParams
      };
      this.events.publish('IncomingDataRedir', nextView);

      return true;
    } else if (
      data &&
      data.indexOf(this.appProvider.info.name + '://coinbase') === 0
    ) {
      this.logger.debug('Handling Coinbase URL');

      let code = this.getParameterByName('code', data);
      let stateParams = { code };
      let nextView = {
        name: 'CoinbasePage',
        params: stateParams
      };
      this.events.publish('IncomingDataRedir', nextView);

      return true;
      // BitPayCard Authentication
    } else if (data && data.indexOf(this.appProvider.info.name + '://') === 0) {
      this.logger.debug('Handling BitPayCard URL');

      // Disable BitPay Card
      if (!this.appProvider.info._enabledExtensions.debitcard) return false;

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
      return true;

      // Join
    } else if (data && data.match(/^copay:[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      this.logger.debug('Handling Join Wallet');

      let stateParams = { url: data, fromScan: true };
      let nextView = {
        name: 'JoinWalletPage',
        params: stateParams
      };
      this.events.publish('IncomingDataRedir', nextView);
      return true;
      // Old join
    } else if (data && data.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      this.logger.debug('Handling Old Join Wallet');

      let stateParams = { url: data, fromScan: true };
      let nextView = {
        name: 'JoinWalletPage',
        params: stateParams
      };
      this.events.publish('IncomingDataRedir', nextView);
      return true;
    } else if (
      data &&
      (data.substring(0, 2) == '6P' || this.checkPrivateKey(data))
    ) {
      this.logger.debug('Handling private key');
      this.showMenu({
        data,
        type: 'privateKey'
      });
      return true;
    } else if (
      data &&
      (data.substring(0, 2) == '1|' ||
        data.substring(0, 2) == '2|' ||
        data.substring(0, 2) == '3|')
    ) {
      this.logger.debug('Handling QR Code Export feature');

      let stateParams = { code: data, fromScan: true };
      let nextView = {
        name: 'ImportWalletPage',
        params: stateParams
      };
      this.events.publish('IncomingDataRedir', nextView);
      return true;
    } else {
      if (redirParams.activePage === 'ScanPage') {
        this.logger.debug('Handling plain text');
        this.showMenu({
          data,
          type: 'text'
        });
        return true;
      }
    }
    return false;
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
    coin: Coin,
    useSendMax: boolean
  ): void {
    if (amount) {
      let stateParams = {
        amount,
        toAddress: addr,
        description: message,
        coin,
        useSendMax
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

  private handlePayPro(payProDetails, coin?: Coin): void {
    if (!payProDetails) {
      this.popupProvider.ionicAlert(
        this.translate.instant('Error'),
        this.translate.instant('No wallets available')
      );
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
}
