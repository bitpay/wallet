import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { App, Events, NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// providers
import { AppProvider } from '../app/app';
import { BwcProvider } from '../bwc/bwc';
import { PayproProvider } from '../paypro/paypro';
import { PopupProvider } from '../popup/popup';
import { ScanProvider } from '../scan/scan';

// pages
import { ImportWalletPage } from '../../pages/add/import-wallet/import-wallet';
import { JoinWalletPage } from '../../pages/add/join-wallet/join-wallet';
import { BitPayCardIntroPage } from '../../pages/integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';
import { CoinbasePage } from '../../pages/integrations/coinbase/coinbase';
import { GlideraPage } from '../../pages/integrations/glidera/glidera';
import { AmountPage } from '../../pages/send/amount/amount';
import { ConfirmPage } from '../../pages/send/confirm/confirm';

@Injectable()
export class IncomingDataProvider {
  private navCtrl: NavController;
  constructor(
    private app: App,
    private events: Events,
    private bwcProvider: BwcProvider,
    private payproProvider: PayproProvider,
    private scanProvider: ScanProvider,
    private popupProvider: PopupProvider,
    private logger: Logger,
    private appProvider: AppProvider,
    private translate: TranslateService
  ) {
    this.logger.info('IncomingDataProvider initialized.');
  }

  public showMenu(data: any): void {
    this.events.publish('incomingDataMenu.showMenu', data);
  }

  public redir(data: string): boolean {
    // TODO Injecting NavController in constructor of service fails with no provider error
    this.navCtrl = this.app.getActiveNav();

    // data extensions for Payment Protocol with non-backwards-compatible request
    if ((/^bitcoin(cash)?:\?r=[\w+]/).exec(data)) {
      let coin = 'btc';
      if (data.indexOf('bitcoincash') === 0) coin = 'bch';

      data = decodeURIComponent(data.replace(/bitcoin(cash)?:\?r=/, ''));

      this.payproProvider.getPayProDetails(data, coin).then((details) => {
        this.handlePayPro(details, coin);
      }).catch((err) => {
        this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
      });

      return true;
    }

    data = this.sanitizeUri(data);
    let amount: string;
    let message: string;
    let addr: string;
    let parsed: any;
    let coin: string;

    // Bitcoin  URL
    if (this.bwcProvider.getBitcore().URI.isValid(data)) {
      this.logger.debug('Handling Bitcoin URI');
      coin = 'btc';
      parsed = this.bwcProvider.getBitcore().URI(data);
      addr = parsed.address ? parsed.address.toString() : '';
      message = parsed.message;
      amount = parsed.amount ? parsed.amount : '';

      if (parsed.r) {
        this.payproProvider.getPayProDetails(parsed.r, coin).then((details) => {
          this.handlePayPro(details, coin);
        }).catch((err: string) => {
          if (addr && amount) this.goSend(addr, amount, message, coin);
          else this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
        });
      } else {
        this.goSend(addr, amount, message, coin);
      }
      return true;
      // Cash URI
    } else if (this.bwcProvider.getBitcoreCash().URI.isValid(data)) {
      this.logger.debug('Handling Bitcoin Cash URI');
      coin = 'bch';
      parsed = this.bwcProvider.getBitcoreCash().URI(data);
      addr = parsed.address ? parsed.address.toString() : '';

      // keep address in original format
      if (parsed.address && data.indexOf(addr) < 0) {
        addr = parsed.address.toCashAddress();
      };

      message = parsed.message;
      amount = parsed.amount ? parsed.amount : '';

      // paypro not yet supported on cash
      if (parsed.r) {
        this.payproProvider.getPayProDetails(parsed.r, coin).then((details: any) => {
          this.handlePayPro(details, coin);
        }).catch((err: string) => {
          if (addr && amount)
            this.goSend(addr, amount, message, coin);
          else
            this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
        });
      } else {
        this.goSend(addr, amount, message, coin);
      }
      return true;

      // Cash URI with bitcoin core address version number?
    } else if (this.bwcProvider.getBitcore().URI.isValid(data.replace(/^bitcoincash:/, 'bitcoin:'))) {
      this.logger.debug('Handling bitcoincash URI with legacy address');
      coin = 'bch';
      parsed = this.bwcProvider.getBitcore().URI(data.replace(/^bitcoincash:/, 'bitcoin:'));

      let oldAddr = parsed.address ? parsed.address.toString() : '';
      if (!oldAddr) return false;

      addr = '';

      let a = this.bwcProvider.getBitcore().Address(oldAddr).toObject();
      addr = this.bwcProvider.getBitcoreCash().Address.fromObject(a).toString();

      // Translate address
      this.logger.debug('address transalated to:' + addr);
      let title = this.translate.instant('Bitcoin cash Payment');
      let msg = this.translate.instant('Payment address was translated to new Bitcoin Cash address format: {{addr}}', { addr });
      this.popupProvider.ionicConfirm(title, msg).then((res: boolean) => {
        if (!res) return false;

        message = parsed.message;
        amount = parsed.amount ? parsed.amount : '';

        // paypro not yet supported on cash
        if (parsed.r) {
          this.payproProvider.getPayProDetails(parsed.r, coin).then((details) => {
            this.handlePayPro(details, coin);
          }).catch((err) => {
            if (addr && amount)
              this.goSend(addr, amount, message, coin);
            else
              this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
          });
        } else {
          this.goSend(addr, amount, message, coin);
        }
      });
      return true;
      // Plain URL
    } else if (/^https?:\/\//.test(data)) {
      this.logger.debug('Handling Plain URL');

      let coin = 'btc';

      this.payproProvider.getPayProDetails(data, coin).then((details) => {
        // TODO review
        this.handlePayPro(details, 'btc');
        return true;
      }).catch(() => {
        this.showMenu({
          data,
          type: 'url'
        });
        return;
      });
      // Plain Address
    } else if (this.bwcProvider.getBitcore().Address.isValid(data, 'livenet') || this.bwcProvider.getBitcore().Address.isValid(data, 'testnet')) {
      this.logger.debug('Handling Bitcoin Plain Address');
      if (this.navCtrl.getActive().name === 'ScanPage') {
        this.showMenu({
          data,
          type: 'bitcoinAddress',
          coin: 'btc'
        });
      } else {
        let coin = 'btc';
        this.goToAmountPage(data, coin);
      }
    } else if (this.bwcProvider.getBitcoreCash().Address.isValid(data, 'livenet')) {
      this.logger.debug('Handling Bitcoin Cash Plain Address');
      if (this.navCtrl.getActive().name === 'ScanPage') {
        this.showMenu({
          data,
          type: 'bitcoinAddress',
          coin: 'bch',
        });
      } else {
        let coin = 'bch';
        this.goToAmountPage(data, coin);
      }
    } else if (data && data.indexOf(this.appProvider.info.name + '://glidera') === 0) {

      let code = this.getParameterByName('code', data);
      this.navCtrl.push(GlideraPage, { code });

      this.logger.debug('Glidera TODO');
      return true;
    } else if (data && data.indexOf(this.appProvider.info.name + '://coinbase') === 0) {

      let code = this.getParameterByName('code', data);
      this.navCtrl.push(CoinbasePage, { code });

      this.logger.debug('Coinbase TODO');
      return true;
      // BitPayCard Authentication
    } else if (data && data.indexOf(this.appProvider.info.name + '://') === 0) {

      // Disable BitPay Card
      if (!this.appProvider.info._enabledExtensions.debitcard) return false;

      // For BitPay card binding
      let secret = this.getParameterByName('secret', data);
      let email = this.getParameterByName('email', data);
      let otp = this.getParameterByName('otp', data);
      let reason = this.getParameterByName('r', data);
      switch (reason) {
        default:
        case '0':
          /* For BitPay card binding */
          this.navCtrl.parent.select(0);
          this.navCtrl.push(BitPayCardIntroPage, { secret, email, otp });
          break;
      }
      return true;

      // Join
    } else if (data && data.match(/^copay:[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      this.navCtrl.push(JoinWalletPage, { url: data, fromScan: true })
      return true;
      // Old join
    } else if (data && data.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      this.navCtrl.push(JoinWalletPage, { url: data, fromScan: true })
      return true;
    } else if (data && (data.substring(0, 2) == '6P' || this.checkPrivateKey(data))) {
      this.logger.debug('Handling private key');
      this.showMenu({
        data,
        type: 'privateKey'
      });
    } else if (data && ((data.substring(0, 2) == '1|') || (data.substring(0, 2) == '2|') || (data.substring(0, 2) == '3|'))) {
      this.navCtrl.push(ImportWalletPage, { code: data, fromScan: true })
      return true;

    } else {

      if (this.navCtrl.getActive().name === 'ScanPage') {
        this.logger.debug('Handling plain text');
        this.showMenu({
          data,
          type: 'text'
        });
      }
    }
    return false;
  }

  private sanitizeUri(data: any): string {
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
    if (!url) return;
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  private checkPrivateKey(privateKey: string): boolean {
    try {
      this.bwcProvider.getBitcore().PrivateKey(privateKey, 'livenet');
    } catch (err) {
      return false;
    }
    return true;
  }

  private goSend(addr: string, amount: string, message: string, coin: string): void {
    if (amount) {
      this.navCtrl.push(ConfirmPage, {
        amount,
        toAddress: addr,
        description: message,
        coin
      });
    } else {
      this.navCtrl.push(AmountPage, {
        toAddress: addr,
        coin
      });
    }
  }

  private goToAmountPage(toAddress: string, coin: string) {
    this.navCtrl.push(AmountPage, {
      toAddress,
      coin
    });
  }

  private handlePayPro(payProDetails: any, coin?: string): void {
    let stateParams = {
      amount: payProDetails.amount,
      toAddress: payProDetails.toAddress,
      description: payProDetails.memo,
      paypro: payProDetails,
      coin
    };
    this.scanProvider.pausePreview();
    this.navCtrl.push(ConfirmPage, stateParams);
  }

}
