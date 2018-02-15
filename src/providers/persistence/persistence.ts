import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file';
import * as _ from 'lodash';
import { Logger } from '../../providers/logger/logger';

import { PlatformProvider } from '../platform/platform';
import { FileStorage } from './storage/file-storage';
import { LocalStorage } from './storage/local-storage';
//import { RamStorage } from './storage/ram-storage';

const Keys = {
  ADDRESS_BOOK: network => 'addressbook-' + network,
  AGREE_DISCLAIMER: 'agreeDisclaimer',
  AMAZON_GIFT_CARDS: network => 'amazonGiftCards-' + network,
  APP_IDENTITY: network => 'appIdentity-' + network,
  BACKUP: walletId => 'backup-' + walletId,
  BALANCE_CACHE: cardId => 'balanceCache-' + cardId,
  BITPAY_ACCOUNTS_V2: network => 'bitpayAccounts-v2-' + network,
  CLEAN_AND_SCAN_ADDRESSES: 'CleanAndScanAddresses',
  COINBASE_REFRESH_TOKEN: network => 'coinbaseRefreshToken-' + network,
  COINBASE_TOKEN: network => 'coinbaseToken-' + network,
  COINBASE_TXS: network => 'coinbaseTxs-' + network,
  CONFIG: 'config',
  FEEDBACK: 'feedback',
  FOCUSED_WALLET_ID: 'focusedWalletId',
  GLIDERA_PERMISSIONS: network => 'glideraPermissions-' + network,
  GLIDERA_STATUS: network => 'glideraStatus-' + network,
  GLIDERA_TOKEN: network => 'glideraToken-' + network,
  GLIDERA_TXS: network => 'glideraTxs-' + network,
  HIDE_BALANCE: walletId => 'hideBalance-' + walletId,
  HOME_TIP: 'homeTip',
  LAST_ADDRESS: walletId => 'lastAddress-' + walletId,
  LAST_CURRENCY_USED: 'lastCurrencyUsed',
  MERCADO_LIBRE: network => 'MercadoLibreGiftCards-' + network,
  PROFILE: 'profile',
  REMOTE_PREF_STORED: 'remotePrefStored',
  TX_CONFIRM_NOTIF: txid => 'txConfirmNotif-' + txid,
  TX_HISTORY: walletId => 'txsHistory-' + walletId
};

interface Storage {
  get(k: string): Promise<any>;
  set(k: string, v: any): Promise<void>;
  remove(k: string): Promise<void>;
  create(k: string, v: any): Promise<void>;
}

@Injectable()
export class PersistenceProvider {
  public storage: Storage;

  constructor(
    private logger: Logger,
    private platform: PlatformProvider,
    private file: File
  ) {
    this.logger.info('PersistenceProvider initialized.');
  }

  public load() {
    if (this.platform.isCordova) {
      this.storage = new FileStorage(this.file, this.logger);
    } else {
      this.storage = new LocalStorage();
    }
  }

  public storeNewProfile(profile): Promise<void> {
    return this.storage.create(Keys.PROFILE, profile);
  }

  public storeProfile(profile): Promise<void> {
    return this.storage.set(Keys.PROFILE, profile);
  }

  public getProfile(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.storage.get(Keys.PROFILE).then(profile => {
        resolve(profile);
      });
    });
  }

  public deleteProfile(): Promise<void> {
    return this.storage.remove(Keys.PROFILE);
  }

  public setFeedbackInfo(feedbackValues: any): Promise<void> {
    return this.storage.set(Keys.FEEDBACK, feedbackValues);
  }

  public getFeedbackInfo(): Promise<void> {
    return this.storage.get(Keys.FEEDBACK);
  }

  public storeFocusedWalletId(walletId: string): Promise<void> {
    return this.storage.set(Keys.FOCUSED_WALLET_ID, walletId || '');
  }

  public getFocusedWalletId(): Promise<string> {
    return this.storage.get(Keys.FOCUSED_WALLET_ID);
  }

  public getLastAddress(walletId: string): Promise<any> {
    return this.storage.get(Keys.LAST_ADDRESS(walletId));
  }

  public storeLastAddress(walletId: string, address: any): Promise<void> {
    return this.storage.set(Keys.LAST_ADDRESS(walletId), address);
  }

  public clearLastAddress(walletId: string): Promise<void> {
    return this.storage.remove(Keys.LAST_ADDRESS(walletId));
  }

  public setBackupFlag(walletId: string): Promise<void> {
    return this.storage.set(Keys.BACKUP(walletId), Date.now());
  }

  public getBackupFlag(walletId: string): Promise<any> {
    return this.storage.get(Keys.BACKUP(walletId));
  }

  public clearBackupFlag(walletId: string): Promise<void> {
    return this.storage.remove(Keys.BACKUP(walletId));
  }

  public setCleanAndScanAddresses(walletId: string): Promise<void> {
    return this.storage.set(Keys.CLEAN_AND_SCAN_ADDRESSES, walletId);
  }

  public getCleanAndScanAddresses(): Promise<any> {
    return this.storage.get(Keys.CLEAN_AND_SCAN_ADDRESSES);
  }

  public removeCleanAndScanAddresses(): Promise<void> {
    return this.storage.remove(Keys.CLEAN_AND_SCAN_ADDRESSES);
  }

  public getConfig(): Promise<object> {
    return this.storage.get(Keys.CONFIG);
  }

  public storeConfig(config: object): Promise<void> {
    return this.storage.set(Keys.CONFIG, config);
  }

  public clearConfig(): Promise<void> {
    return this.storage.remove(Keys.CONFIG);
  }

  public getHomeTipAccepted(): Promise<any> {
    return this.storage.get(Keys.HOME_TIP);
  }

  public setHomeTipAccepted(homeTip: any): Promise<void> {
    return this.storage.set(Keys.HOME_TIP, homeTip);
  }

  public setHideBalanceFlag(walletId: string, val: any): Promise<void> {
    return this.storage.set(Keys.HIDE_BALANCE(walletId), val);
  }

  public getHideBalanceFlag(walletId: string): Promise<any> {
    return this.storage.get(Keys.HIDE_BALANCE(walletId));
  }

  public setDisclaimerAccepted(): Promise<any> {
    return this.storage.set(Keys.AGREE_DISCLAIMER, true);
  }

  //for compatibility
  public getCopayDisclaimerFlag(): Promise<any> {
    return this.storage.get(Keys.AGREE_DISCLAIMER);
  }

  public setRemotePrefsStoredFlag(): Promise<void> {
    return this.storage.set(Keys.REMOTE_PREF_STORED, true);
  }

  public getRemotePrefsStoredFlag(): Promise<any> {
    return this.storage.get(Keys.REMOTE_PREF_STORED);
  }

  public setGlideraToken(network: string, token: string): Promise<void> {
    return this.storage.set(Keys.GLIDERA_TOKEN(network), token);
  }

  public getGlideraToken(network: string): Promise<string> {
    return this.storage.get(Keys.GLIDERA_TOKEN(network));
  }

  public removeGlideraToken(network: string): Promise<void> {
    return this.storage.remove(Keys.GLIDERA_TOKEN(network));
  }

  public setGlideraPermissions(
    network: string,
    permissions: any
  ): Promise<void> {
    return this.storage.set(Keys.GLIDERA_PERMISSIONS(network), permissions);
  }

  public getGlideraPermissions(network: string): Promise<any> {
    return this.storage.get(Keys.GLIDERA_PERMISSIONS(network));
  }

  public removeGlideraPermissions(network: string): Promise<void> {
    return this.storage.remove(Keys.GLIDERA_PERMISSIONS(network));
  }

  public setGlideraStatus(network: string, status: any): Promise<void> {
    return this.storage.set(Keys.GLIDERA_STATUS(network), status);
  }

  public getGlideraStatus(network: string): Promise<any> {
    return this.storage.get(Keys.GLIDERA_STATUS(network));
  }

  public removeGlideraStatus(network: string): Promise<void> {
    return this.storage.remove(Keys.GLIDERA_STATUS(network));
  }

  public setGlideraTxs(network: string, txs: any): Promise<void> {
    return this.storage.set(Keys.GLIDERA_TXS(network), txs);
  }

  public getGlideraTxs(network: string): Promise<any> {
    return this.storage.get(Keys.GLIDERA_TXS(network));
  }

  public removeGlideraTxs(network: string): Promise<void> {
    return this.storage.remove(Keys.GLIDERA_TXS(network));
  }

  public setCoinbaseToken(network: string, token: string): Promise<void> {
    return this.storage.set(Keys.COINBASE_TOKEN(network), token);
  }

  public getCoinbaseToken(network: string): Promise<string> {
    return this.storage.get(Keys.COINBASE_TOKEN(network));
  }

  public removeCoinbaseToken(network: string): Promise<void> {
    return this.storage.remove(Keys.COINBASE_TOKEN(network));
  }

  public setCoinbaseRefreshToken(
    network: string,
    token: string
  ): Promise<void> {
    return this.storage.set(Keys.COINBASE_REFRESH_TOKEN(network), token);
  }

  public getCoinbaseRefreshToken(network: string): Promise<string> {
    return this.storage.get(Keys.COINBASE_REFRESH_TOKEN(network));
  }

  public removeCoinbaseRefreshToken(network: string): Promise<void> {
    return this.storage.remove(Keys.COINBASE_REFRESH_TOKEN(network));
  }

  public setCoinbaseTxs(network: string, ctx: any): Promise<void> {
    return this.storage.set(Keys.COINBASE_TXS(network), ctx);
  }

  public getCoinbaseTxs(network: string): Promise<any> {
    return this.storage.get(Keys.COINBASE_TXS(network));
  }

  public removeCoinbaseTxs(network: string): Promise<void> {
    return this.storage.remove(Keys.COINBASE_TXS(network));
  }

  public setAddressbook(network: string, addressbook: any): Promise<void> {
    return this.storage.set(Keys.ADDRESS_BOOK(network), addressbook);
  }

  public getAddressbook(network: string): Promise<any> {
    return this.storage.get(Keys.ADDRESS_BOOK(network));
  }

  public removeAddressbook(network: string): Promise<void> {
    return this.storage.remove(Keys.ADDRESS_BOOK(network));
  }

  public setLastCurrencyUsed(lastCurrencyUsed: any): Promise<void> {
    return this.storage.set(Keys.LAST_CURRENCY_USED, lastCurrencyUsed);
  }

  public getLastCurrencyUsed(): Promise<any> {
    return this.storage.get(Keys.LAST_CURRENCY_USED);
  }

  public checkQuota(): void {
    let block = '';
    // 50MB
    for (let i = 0; i < 1024 * 1024; ++i) {
      block += '12345678901234567890123456789012345678901234567890';
    }
    this.storage.set('test', block).catch(err => {
      this.logger.error('CheckQuota Return:' + err);
    });
  }

  public setTxHistory(walletId: string, txs: any): Promise<void> {
    return this.storage.set(Keys.TX_HISTORY(walletId), txs).catch(err => {
      this.logger.error('Error saving tx History. Size:' + txs.length);
      this.logger.error(err);
    });
  }

  public getTxHistory(walletId: string): Promise<any> {
    return this.storage.get(Keys.TX_HISTORY(walletId));
  }

  public removeTxHistory(walletId: string): Promise<void> {
    return this.storage.remove(Keys.TX_HISTORY(walletId));
  }

  public setBalanceCache(cardId: string, data: any): Promise<void> {
    return this.storage.set(Keys.BALANCE_CACHE(cardId), data);
  }

  public getBalanceCache(cardId: string): Promise<any> {
    return this.storage.get(Keys.BALANCE_CACHE(cardId));
  }

  public removeBalanceCache(cardId: string): Promise<void> {
    return this.storage.remove(Keys.BALANCE_CACHE(cardId));
  }

  public setAppIdentity(network: string, data: any): Promise<void> {
    return this.storage.set(Keys.APP_IDENTITY(network), data);
  }

  public getAppIdentity(network: string): Promise<any> {
    return this.storage.get(Keys.APP_IDENTITY(network));
  }

  public removeAppIdentity(network: string): Promise<void> {
    return this.storage.remove(Keys.APP_IDENTITY(network));
  }

  public removeAllWalletData(walletId: string): Promise<void> {
    return this.clearLastAddress(walletId)
      .then(() => this.removeTxHistory(walletId))
      .then(() => this.clearBackupFlag(walletId));
  }

  public setAmazonGiftCards(network: string, gcs: any): Promise<void> {
    return this.storage.set(Keys.AMAZON_GIFT_CARDS(network), gcs);
  }

  public getAmazonGiftCards(network: string): Promise<any> {
    return this.storage.get(Keys.AMAZON_GIFT_CARDS(network));
  }

  public removeAmazonGiftCards(network: string): Promise<void> {
    return this.storage.remove(Keys.AMAZON_GIFT_CARDS(network));
  }

  public setTxConfirmNotification(txid: string, val: any): Promise<void> {
    return this.storage.set(Keys.TX_CONFIRM_NOTIF(txid), val);
  }

  public getTxConfirmNotification(txid: string): Promise<any> {
    return this.storage.get(Keys.TX_CONFIRM_NOTIF(txid));
  }

  public removeTxConfirmNotification(txid: string): Promise<void> {
    return this.storage.remove(Keys.TX_CONFIRM_NOTIF(txid));
  }

  // cb(err, accounts)
  // accounts: {
  //   email_1: {
  //     token: account token
  //     cards: {
  //       <card-data>
  //     }
  //   }
  //   ...
  //   email_n: {
  //    token: account token
  //    cards: {
  //       <card-data>
  //     }
  //   }
  // }
  //
  public getBitpayAccounts(network: string): Promise<any> {
    return this.storage.get(Keys.BITPAY_ACCOUNTS_V2(network));
  }

  public setBitpayAccount(
    network: string,
    data: {
      email: string;
      token: string;
      familyName?: string; // last name
      givenName?: string; // firstName
    }
  ): Promise<any> {
    return this.getBitpayAccounts(network).then(allAccounts => {
      allAccounts = allAccounts || {};
      const account = allAccounts[data.email] || {};
      account.token = data.token;
      account.familyName = data.familyName;
      account.givenName = data.givenName;
      allAccounts[data.email] = account;

      this.logger.info(
        'Storing BitPay accounts with new account:' + data.email
      );
      return this.storage.set(Keys.BITPAY_ACCOUNTS_V2(network), allAccounts);
    });
  }

  public removeBitpayAccount(network: string, email: string): Promise<void> {
    return this.getBitpayAccounts(network).then(allAccounts => {
      allAccounts = allAccounts || {};
      delete allAccounts[email];
      return this.storage.set(Keys.BITPAY_ACCOUNTS_V2(network), allAccounts);
    });
  }

  // cards: [
  //   eid: card id
  //   id: card id
  //   lastFourDigits: card number
  //   token: card token
  // ]
  public setBitpayDebitCards(
    network: string,
    email: string,
    cards: any
  ): Promise<void> {
    return this.getBitpayAccounts(network).then(allAccounts => {
      allAccounts = allAccounts || {};
      if (!allAccounts[email]) {
        throw new Error('Cannot set cards for unknown account ' + email);
      }
      allAccounts[email].cards = cards;
      return this.storage.set(Keys.BITPAY_ACCOUNTS_V2(network), allAccounts);
    });
  }

  // cards: [
  //   eid: card id
  //   id: card id
  //   lastFourDigits: card number
  //   token: card token
  //   email: account email
  // ]
  public getBitpayDebitCards(network: string): Promise<any[]> {
    return this.getBitpayAccounts(network).then(allAccounts => {
      let allCards = [];
      _.each(allAccounts, (account, email) => {
        if (account.cards) {
          // Add account's email to each card
          const cards = _.clone(account.cards);
          _.each(cards, x => {
            x.email = email;
          });

          allCards = allCards.concat(cards);
        }
      });
      return allCards;
    });
  }

  public removeBitpayDebitCard(
    network: string,
    cardEid: string
  ): Promise<void> {
    return this.getBitpayAccounts(network)
      .then(allAccounts => {
        return _.each(allAccounts, account => {
          account.cards = _.reject(account.cards, {
            eid: cardEid
          });
        });
      })
      .then(allAccounts => {
        return this.storage.set(Keys.BITPAY_ACCOUNTS_V2(network), allAccounts);
      });
  }

  public setMercadoLibreGiftCards(network: string, gcs): Promise<void> {
    return this.storage.set(Keys.MERCADO_LIBRE(network), gcs);
  }

  public getMercadoLibreGiftCards(network: string): Promise<void> {
    return this.storage.get(Keys.MERCADO_LIBRE(network));
  }

  public removeMercadoLibreGiftCards(network: string): Promise<void> {
    return this.storage.remove(Keys.MERCADO_LIBRE(network));
  }

  public setShapeshift(network: string, gcs: any): Promise<void> {
    return this.storage.set('shapeShift-' + network, gcs);
  }

  public getShapeshift(network: string): Promise<void> {
    return this.storage.get('shapeShift-' + network);
  }

  public removeShapeshift(network: string): Promise<void> {
    return this.storage.remove('shapeShift-' + network);
  }

  public setWalletOrder(walletId: string, index: number): Promise<void> {
    return this.storage.set('order-' + walletId, index);
  }

  public getWalletOrder(walletId: string): Promise<void> {
    return this.storage.get('order-' + walletId);
  }
}
