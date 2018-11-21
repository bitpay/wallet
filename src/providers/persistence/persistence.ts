import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file';
import { Events } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../providers/logger/logger';

import { CardName, GiftCard } from '../gift-card/gift-card.types';
import { PlatformProvider } from '../platform/platform';
import { FileStorage } from './storage/file-storage';
import { LocalStorage } from './storage/local-storage';
// TODO import { RamStorage } from './storage/ram-storage';

export enum Network {
  livenet = 'livenet',
  testnet = 'testnet'
}

export interface FeedbackValues {
  time: number;
  version: string;
  sent: boolean;
}

export interface GiftCardMap {
  [invoiceId: string]: GiftCard;
}

const Keys = {
  ADDRESS_BOOK: network => 'addressbook-' + network,
  AGREE_DISCLAIMER: 'agreeDisclaimer',
  GIFT_CARD_USER_INFO: 'amazonUserInfo', // keeps legacy key for backwards compatibility
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
  GIFT_CARD_CONFIG_CACHE: 'giftCardConfigCache',
  GIFT_CARDS: (cardName: CardName, network: Network) => {
    const legacyGiftCardKey = getLegacyGiftCardKey(cardName, network);
    return legacyGiftCardKey || `giftCards-${cardName}-${network}`;
  },
  GLIDERA_PERMISSIONS: network => 'glideraPermissions-' + network,
  GLIDERA_STATUS: network => 'glideraStatus-' + network,
  GLIDERA_TOKEN: network => 'glideraToken-' + network,
  GLIDERA_TXS: network => 'glideraTxs-' + network,
  HIDE_BALANCE: walletId => 'hideBalance-' + walletId,
  HOME_TIP: 'homeTip',
  LAST_ADDRESS: walletId => 'lastAddress-' + walletId,
  LAST_CURRENCY_USED: 'lastCurrencyUsed',
  LOGS: 'logs',
  ONBOARDING_COMPLETED: 'onboardingCompleted',
  PROFILE: 'profile',
  REMOTE_PREF_STORED: 'remotePrefStored',
  TX_CONFIRM_NOTIF: txid => 'txConfirmNotif-' + txid,
  TX_HISTORY: walletId => 'txsHistory-' + walletId,
  ORDER_WALLET: walletId => 'order-' + walletId,
  SERVER_MESSAGE_DISMISSED: 'serverMessageDismissed',
  SHAPESHIFT_TOKEN: network => 'shapeshiftToken-' + network
};

interface Storage {
  get(k: string): Promise<any>;
  set(k: string, v): Promise<void>;
  remove(k: string): Promise<void>;
  create(k: string, v): Promise<void>;
}

@Injectable()
export class PersistenceProvider {
  public storage: Storage;
  private persistentLogs;
  private logsBuffer: Array<{
    timestamp: string;
    level: string;
    msg: string;
  }>;
  private logsLoaded: boolean;
  private persistentLogsEnabled: boolean;

  constructor(
    private logger: Logger,
    private platform: PlatformProvider,
    private file: File,
    private events: Events
  ) {
    this.logger.debug('PersistenceProvider initialized');
    this.persistentLogs = {};
    this.logsBuffer = [];
    this.logsLoaded = false;
    this.persistentLogsEnabled = false;
    // this._subscribeEvents();
  }

  private _subscribeEvents(): void {
    this.events.subscribe('newLog', newLog => {
      setTimeout(() => {
        this.saveNewLog(newLog);
      }, 0);
    });
  }

  private _unsubscribeEvents(): void {
    this.events.unsubscribe('newLog');
    this.logsBuffer = [];
    this.persistentLogsEnabled = false;
  }

  public load() {
    this.storage = this.platform.isCordova
      ? new FileStorage(this.file, this.logger)
      : new LocalStorage(this.logger);
  }

  public getPersistentLogs(): void {
    this.getLogs()
      .then(logs => {
        if (logs && _.isString(logs)) {
          try {
            logs = JSON.parse(logs);
          } catch {
            logs = {};
          }
        }
        logs = logs || {};
        if (_.isArray(logs)) logs = {}; // No array

        this.persistentLogs = this.deleteOldLogs(logs);
        this.logsLoaded = true;
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  public checkLogsConfig(): void {
    this.getConfig()
      .then(config => {
        if (
          _.isEmpty(config) ||
          _.isUndefined(config.persistentLogsEnabled) ||
          config.persistentLogsEnabled
        ) {
          this.persistentLogsEnabled = true;
        } else {
          this._unsubscribeEvents();
        }
      })
      .catch(err => {
        this.logger.error('Error Loading Config from persistence', err);
      });
  }

  private deleteOldLogs(logs) {
    let now = new Date();
    let daysAgo = new Date(now.setDate(now.getDate() - 3));
    // Compare dates and remove logs older than 3 days
    Object.keys(logs).forEach(key => {
      let logDate = new Date(key);
      if (logDate < daysAgo) {
        delete logs[key];
      }
    });
    // Clean if logs entries are more than 6000
    let logsAmount = Object.keys(logs).length;
    if (logsAmount > 6000) {
      let entriesToDelete: number = logsAmount - 6000;
      Object.keys(logs).forEach((key, index) => {
        if (index < entriesToDelete) {
          delete logs[key];
          index++;
        }
      });
    }
    this.logger.debug(
      'Saved logs: ' +
      logsAmount +
      '. Logs after cleaning: ' +
      Object.keys(logs).length
    );
    return logs;
  }

  public persistentLogsChange(enabled: boolean): void {
    this.persistentLogs = {};
    if (enabled) {
      this.persistentLogsEnabled = true;
      this._subscribeEvents();
    } else {
      this._unsubscribeEvents();
      this.setLogs(this.persistentLogs).catch(() => {
        this.logger.warn('Error deleting persistent logs');
      });
    }
  }

  private saveNewLog(newLog): void {
    if (!this.logsLoaded && !this.persistentLogsEnabled) {
      this.logsBuffer.push(newLog);
      return;
    }

    if (!_.isEmpty(this.logsBuffer)) {
      this.logsBuffer.forEach(log => {
        this.saveLog(log);
      });
      this.logsBuffer = [];
    }

    this.saveLog(newLog);
  }

  private saveLog(newLog): void {
    if (this.persistentLogs[newLog.timestamp]) {
      // Logs timestamp collapse
      return;
    }
    this.persistentLogs[newLog.timestamp] = newLog;
    this.setLogs(JSON.stringify(this.persistentLogs)).catch(() => {
      this.logger.warn('Error adding new log');
      // Unsubscribe to prevent errors loop
      this._unsubscribeEvents();
    });
  }

  storeNewProfile(profile): Promise<void> {
    return this.storage.create(Keys.PROFILE, profile);
  }

  storeProfile(profile): Promise<void> {
    return this.storage.set(Keys.PROFILE, profile);
  }

  getProfile(): Promise<any> {
    return new Promise(resolve => {
      this.storage.get(Keys.PROFILE).then(profile => {
        resolve(profile);
      });
    });
  }

  deleteProfile() {
    return this.storage.remove(Keys.PROFILE);
  }

  setFeedbackInfo(feedbackValues: FeedbackValues) {
    return this.storage.set(Keys.FEEDBACK, feedbackValues);
  }

  getFeedbackInfo() {
    return this.storage.get(Keys.FEEDBACK);
  }

  storeFocusedWalletId(walletId: string) {
    return this.storage.set(Keys.FOCUSED_WALLET_ID, walletId || '');
  }

  getFocusedWalletId(): Promise<string> {
    return this.storage.get(Keys.FOCUSED_WALLET_ID);
  }

  getLastAddress(walletId: string) {
    return this.storage.get(Keys.LAST_ADDRESS(walletId));
  }

  storeLastAddress(walletId: string, address) {
    return this.storage.set(Keys.LAST_ADDRESS(walletId), address);
  }

  clearLastAddress(walletId: string) {
    return this.storage.remove(Keys.LAST_ADDRESS(walletId));
  }

  setBackupFlag(walletId: string) {
    return this.storage.set(Keys.BACKUP(walletId), Date.now());
  }

  getBackupFlag(walletId: string) {
    return this.storage.get(Keys.BACKUP(walletId));
  }

  clearBackupFlag(walletId: string) {
    return this.storage.remove(Keys.BACKUP(walletId));
  }

  setCleanAndScanAddresses(walletId: string) {
    return this.storage.set(Keys.CLEAN_AND_SCAN_ADDRESSES, walletId);
  }

  getCleanAndScanAddresses() {
    return this.storage.get(Keys.CLEAN_AND_SCAN_ADDRESSES);
  }

  removeCleanAndScanAddresses() {
    return this.storage.remove(Keys.CLEAN_AND_SCAN_ADDRESSES);
  }

  getConfig() {
    return this.storage.get(Keys.CONFIG);
  }

  storeConfig(config: object) {
    return this.storage.set(Keys.CONFIG, config);
  }

  clearConfig() {
    return this.storage.remove(Keys.CONFIG);
  }

  getHomeTipAccepted() {
    return this.storage.get(Keys.HOME_TIP);
  }

  setHomeTipAccepted(homeTip) {
    return this.storage.set(Keys.HOME_TIP, homeTip);
  }

  setHideBalanceFlag(walletId: string, val) {
    return this.storage.set(Keys.HIDE_BALANCE(walletId), val);
  }

  getHideBalanceFlag(walletId: string) {
    return this.storage.get(Keys.HIDE_BALANCE(walletId));
  }

  setDisclaimerAccepted() {
    return this.storage.set(Keys.AGREE_DISCLAIMER, true);
  }

  setOnboardingCompleted() {
    return this.storage.set(Keys.ONBOARDING_COMPLETED, true);
  }

  // for compatibility
  getCopayDisclaimerFlag() {
    return this.storage.get(Keys.AGREE_DISCLAIMER);
  }

  getCopayOnboardingFlag() {
    return this.storage.get(Keys.ONBOARDING_COMPLETED);
  }

  setRemotePrefsStoredFlag() {
    return this.storage.set(Keys.REMOTE_PREF_STORED, true);
  }

  getRemotePrefsStoredFlag() {
    return this.storage.get(Keys.REMOTE_PREF_STORED);
  }

  setGlideraToken(network: string, token: string) {
    return this.storage.set(Keys.GLIDERA_TOKEN(network), token);
  }

  getGlideraToken(network: string) {
    return this.storage.get(Keys.GLIDERA_TOKEN(network));
  }

  removeGlideraToken(network: string) {
    return this.storage.remove(Keys.GLIDERA_TOKEN(network));
  }

  setGlideraPermissions(network: string, permissions) {
    return this.storage.set(Keys.GLIDERA_PERMISSIONS(network), permissions);
  }

  getGlideraPermissions(network: string) {
    return this.storage.get(Keys.GLIDERA_PERMISSIONS(network));
  }

  removeGlideraPermissions(network: string) {
    return this.storage.remove(Keys.GLIDERA_PERMISSIONS(network));
  }

  setGlideraStatus(network: string, status) {
    return this.storage.set(Keys.GLIDERA_STATUS(network), status);
  }

  getGlideraStatus(network: string) {
    return this.storage.get(Keys.GLIDERA_STATUS(network));
  }

  removeGlideraStatus(network: string) {
    return this.storage.remove(Keys.GLIDERA_STATUS(network));
  }

  setGlideraTxs(network: string, txs) {
    return this.storage.set(Keys.GLIDERA_TXS(network), txs);
  }

  getGlideraTxs(network: string) {
    return this.storage.get(Keys.GLIDERA_TXS(network));
  }

  removeGlideraTxs(network: string) {
    return this.storage.remove(Keys.GLIDERA_TXS(network));
  }

  setCoinbaseToken(network: string, token: string) {
    return this.storage.set(Keys.COINBASE_TOKEN(network), token);
  }

  getCoinbaseToken(network: string) {
    return this.storage.get(Keys.COINBASE_TOKEN(network));
  }

  removeCoinbaseToken(network: string) {
    return this.storage.remove(Keys.COINBASE_TOKEN(network));
  }

  setCoinbaseRefreshToken(network: string, token: string) {
    return this.storage.set(Keys.COINBASE_REFRESH_TOKEN(network), token);
  }

  getCoinbaseRefreshToken(network: string) {
    return this.storage.get(Keys.COINBASE_REFRESH_TOKEN(network));
  }

  removeCoinbaseRefreshToken(network: string) {
    return this.storage.remove(Keys.COINBASE_REFRESH_TOKEN(network));
  }

  setCoinbaseTxs(network: string, ctx) {
    return this.storage.set(Keys.COINBASE_TXS(network), ctx);
  }

  getCoinbaseTxs(network: string) {
    return this.storage.get(Keys.COINBASE_TXS(network));
  }

  removeCoinbaseTxs(network: string) {
    return this.storage.remove(Keys.COINBASE_TXS(network));
  }

  setLogs(logs) {
    return this.storage.set(Keys.LOGS, logs);
  }

  getLogs() {
    return this.storage.get(Keys.LOGS);
  }

  removeLogs() {
    return this.storage.remove(Keys.LOGS);
  }

  setAddressBook(network: string, addressbook) {
    return this.storage.set(Keys.ADDRESS_BOOK(network), addressbook);
  }

  getAddressBook(network: string) {
    return this.storage.get(Keys.ADDRESS_BOOK(network));
  }

  removeAddressbook(network: string) {
    return this.storage.remove(Keys.ADDRESS_BOOK(network));
  }

  setLastCurrencyUsed(lastCurrencyUsed) {
    return this.storage.set(Keys.LAST_CURRENCY_USED, lastCurrencyUsed);
  }

  getLastCurrencyUsed() {
    return this.storage.get(Keys.LAST_CURRENCY_USED);
  }

  checkQuota() {
    let block = '';
    // 50MB
    for (let i = 0; i < 1024 * 1024; ++i) {
      block += '12345678901234567890123456789012345678901234567890';
    }
    this.storage.set('test', block).catch(err => {
      this.logger.error('CheckQuota Return:' + err);
    });
  }

  setTxHistory(walletId: string, txs) {
    return this.storage.set(Keys.TX_HISTORY(walletId), txs).catch(err => {
      this.logger.error('Error saving tx History. Size:' + txs.length);
      this.logger.error(err);
    });
  }

  getTxHistory(walletId: string) {
    return this.storage.get(Keys.TX_HISTORY(walletId));
  }

  removeTxHistory(walletId: string) {
    return this.storage.remove(Keys.TX_HISTORY(walletId));
  }

  setBalanceCache(cardId: string, data) {
    return this.storage.set(Keys.BALANCE_CACHE(cardId), data);
  }

  getBalanceCache(cardId: string) {
    return this.storage.get(Keys.BALANCE_CACHE(cardId));
  }

  removeBalanceCache(cardId: string) {
    return this.storage.remove(Keys.BALANCE_CACHE(cardId));
  }

  setAppIdentity(network: string, data) {
    return this.storage.set(Keys.APP_IDENTITY(network), data);
  }

  getAppIdentity(network: string) {
    return this.storage.get(Keys.APP_IDENTITY(network));
  }

  removeAppIdentity(network: string) {
    return this.storage.remove(Keys.APP_IDENTITY(network));
  }

  removeAllWalletData(walletId: string) {
    return this.clearLastAddress(walletId)
      .then(() => this.removeTxHistory(walletId))
      .then(() => this.clearBackupFlag(walletId))
      .then(() => this.removeWalletOrder(walletId));
  }

  setGiftCardConfigCache(data) {
    return this.storage.set(Keys.GIFT_CARD_CONFIG_CACHE, data);
  }

  getGiftCardConfigCache() {
    return this.storage.get(Keys.GIFT_CARD_CONFIG_CACHE);
  }

  removeGiftCardConfigCache() {
    return this.storage.remove(Keys.GIFT_CARD_CONFIG_CACHE);
  }

  setGiftCardUserInfo(data) {
    return this.storage.set(Keys.GIFT_CARD_USER_INFO, data);
  }

  getGiftCardUserInfo() {
    return this.storage.get(Keys.GIFT_CARD_USER_INFO);
  }

  removeGiftCardUserInfo() {
    return this.storage.remove(Keys.GIFT_CARD_USER_INFO);
  }

  setTxConfirmNotification(txid: string, val) {
    return this.storage.set(Keys.TX_CONFIRM_NOTIF(txid), val);
  }

  getTxConfirmNotification(txid: string) {
    return this.storage.get(Keys.TX_CONFIRM_NOTIF(txid));
  }

  removeTxConfirmNotification(txid: string) {
    return this.storage.remove(Keys.TX_CONFIRM_NOTIF(txid));
  }

  getBitpayAccounts(network: string) {
    return this.storage.get(Keys.BITPAY_ACCOUNTS_V2(network));
  }

  setBitpayAccount(
    network: string,
    data: {
      email: string;
      token: string;
      familyName?: string; // last name
      givenName?: string; // firstName
    }
  ) {
    return this.getBitpayAccounts(network).then(allAccounts => {
      allAccounts = allAccounts || {};
      let account = allAccounts[data.email] || {};
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

  removeBitpayAccount(network: string, email: string) {
    return this.getBitpayAccounts(network).then(allAccounts => {
      allAccounts = allAccounts || {};
      delete allAccounts[email];
      return this.storage.set(Keys.BITPAY_ACCOUNTS_V2(network), allAccounts);
    });
  }

  setBitpayDebitCards(network: string, email: string, cards) {
    return this.getBitpayAccounts(network).then(allAccounts => {
      allAccounts = allAccounts || {};
      if (!allAccounts[email])
        throw new Error('Cannot set cards for unknown account ' + email);
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
  getBitpayDebitCards(network: string) {
    return this.getBitpayAccounts(network).then(allAccounts => {
      let allCards = [];
      _.each(allAccounts, (account, email) => {
        if (account.cards) {
          // Add account's email to each card
          var cards = _.clone(account.cards);
          _.each(cards, x => {
            x.email = email;
          });

          allCards = allCards.concat(cards);
        }
      });
      return allCards;
    });
  }

  removeBitpayDebitCard(network: string, cardEid: string) {
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

  setGiftCards(cardName: CardName, network: Network, gcs: string) {
    return this.storage.set(Keys.GIFT_CARDS(cardName, network), gcs);
  }

  getGiftCards(cardName: CardName, network: Network): Promise<GiftCardMap> {
    return this.storage.get(Keys.GIFT_CARDS(cardName, network));
  }

  setServerMessageDismissed(val) {
    return this.storage.set(Keys.SERVER_MESSAGE_DISMISSED, val);
  }

  getServerMessageDismissed() {
    return this.storage.get(Keys.SERVER_MESSAGE_DISMISSED);
  }

  removeServerMessageDismissed() {
    return this.storage.remove(Keys.SERVER_MESSAGE_DISMISSED);
  }

  setShapeshift(network: string, gcs) {
    return this.storage.set('shapeShift-' + network, gcs);
  }

  getShapeshift(network: string) {
    return this.storage.get('shapeShift-' + network);
  }

  removeShapeshift(network: string) {
    return this.storage.remove('shapeShift-' + network);
  }

  setShapeshiftToken(network: string, token: string) {
    return this.storage.set(Keys.SHAPESHIFT_TOKEN(network), token);
  }

  getShapeshiftToken(network: string) {
    return this.storage.get(Keys.SHAPESHIFT_TOKEN(network));
  }

  removeShapeshiftToken(network: string) {
    return this.storage.remove(Keys.SHAPESHIFT_TOKEN(network));
  }

  setWalletOrder(walletId: string, order: number) {
    return this.storage.set(Keys.ORDER_WALLET(walletId), order);
  }

  getWalletOrder(walletId: string) {
    return this.storage.get(Keys.ORDER_WALLET(walletId));
  }

  removeWalletOrder(walletId: string) {
    return this.storage.remove(Keys.ORDER_WALLET(walletId));
  }

  setLockStatus(isLocked: string) {
    return this.storage.set('lockStatus', isLocked);
  }

  getLockStatus() {
    return this.storage.get('lockStatus');
  }

  removeLockStatus() {
    return this.storage.remove('lockStatus');
  }

  setEmailLawCompliance(value: string) {
    return this.storage.set('emailLawCompliance', value);
  }

  getEmailLawCompliance() {
    return this.storage.get('emailLawCompliance');
  }

  removeEmailLawCompliance() {
    return this.storage.remove('emailLawCompliance');
  }
}

function getLegacyGiftCardKey(cardName: CardName, network: Network) {
  switch (cardName + network) {
    case CardName.amazon + Network.livenet:
      return 'amazonGiftCards-livenet';
    case CardName.amazon + Network.testnet:
      return 'amazonGiftCards-testnet';
    case CardName.amazonJapan + Network.livenet:
      return 'amazonGiftCards-livenet-japan';
    case CardName.amazonJapan + Network.testnet:
      return 'amazonGiftCards-testnet-japan';
    case CardName.mercadoLibre + Network.livenet:
      return 'MercadoLibreGiftCards-livenet';
    case CardName.mercadoLibre + Network.testnet:
      return 'MercadoLibreGiftCards-testnet';
    default:
      return undefined;
  }
}
