import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Coin, CurrencyProvider } from '../../providers/currency/currency';
import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { AddressProvider, CoinNetwork } from '../address/address';

import * as _ from 'lodash';
import { Subject } from 'rxjs/Subject';

export interface Contact {
  name: string;
  email?: string;
  address: string;
  tag?: number;
  coin: string;
  network?: string;
}
@Injectable()
export class AddressBookProvider {
  public migratingContactsSubject: Subject<boolean> = new Subject<boolean>();

  constructor(
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private translate: TranslateService,
    private addressProvider: AddressProvider,
    private currencyProvider: CurrencyProvider
  ) {
    this.logger.debug('AddressBookProvider initialized');
    this.migrateOldContacts().then(() => {
      this.logger.debug('Old AddressBook processed');
    });
  }

  public get(addr: string, network: string): Promise<Contact> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider
        .getAddressBook(network, true)
        .then(ab => {
          if (ab && _.isString(ab)) ab = JSON.parse(ab);
          if (ab) {
            const existsAddress = _.find(ab, c => c.address == addr);
            if (existsAddress) resolve(this.getContact(existsAddress));
          }
          return reject(
            new Error('Failed to process AddressBook from storage')
          );
        })
        .catch(err => {
          this.logger.error(err);
          return reject(err);
        });
    });
  }

  public getContactName(addr: string, network: string) {
    return this.get(addr, network)
      .then(ab => {
        if (ab) {
          return ab.name;
        }
        return undefined;
      })
      .catch(err => {
        this.logger.error(err);
        return undefined;
      });
  }

  public list(
    network: string,
    newAddressBook: boolean = true
  ): Promise<Contact[]> {
    return new Promise((resolve, reject) => {
      if (!network)
        return reject('You must provide a network to get a Contact List');
      let contacts: Contact[] = [];
      this.persistenceProvider
        .getAddressBook(network, newAddressBook)
        .then(ab => {
          try {
            if (ab && _.isString(ab)) ab = JSON.parse(ab);
            ab = ab || {};
            _.each(ab, contact => {
              const ctc = this.getContact(contact);
              if (ctc) contacts.push(ctc);
            });
            return resolve(contacts);
          } catch (err) {
            this.logger.error(err);
            return reject(err);
          }
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public getContact(contactStr): Contact {
    const coinInfo: CoinNetwork =
      contactStr.coin && contactStr.network
        ? {
            coin: contactStr.coin,
            network: contactStr.network
          }
        : {
            ...this.addressProvider.getCoinAndNetwork(
              contactStr.address,
              contactStr.network
            )
          };

    const contact: Contact = {
      address: contactStr.address,
      coin: coinInfo.coin,
      network: coinInfo.network,
      name: _.isObject(contactStr) ? contactStr.name : contactStr,
      tag: _.isObject(contactStr) ? contactStr.tag : null,
      email: _.isObject(contactStr) ? contactStr.email : null
    };
    return contact;
  }

  public add(entry: Contact): Promise<any> {
    return new Promise((resolve, reject) => {
      const addrData = _.clone(entry);
      // Validate - redundant - new entry
      const _addrData = this.addressProvider.getCoinAndNetwork(
        entry.address,
        entry.network
      );
      if (
        _.isNull(_addrData) ||
        _.isEmpty(_addrData) ||
        !_addrData.coin ||
        !_addrData.network
      ) {
        let msg = this.translate.instant('Not valid bitcoin address');
        return reject(msg);
      }

      addrData.coin =
        entry.coin &&
        this.currencyProvider.getChain(Coin[entry.coin.toUpperCase()]) ===
          _addrData.coin
          ? entry.coin.toLowerCase()
          : _addrData.coin.toLowerCase();
      addrData.network = _addrData.network;

      this.persistenceProvider
        .getAddressBook(addrData.network)
        .then(ab => {
          if (ab && _.isString(ab)) ab = JSON.parse(ab);
          ab = ab || {};
          if (_.isArray(ab)) ab = {}; // No array
          if (
            _.find(
              ab,
              a => a.address === entry.address && a.coin === entry.coin
            )
          ) {
            let msg = this.translate.instant('Entry already exist');
            return reject(msg);
          }
          ab[entry.address + ' (' + entry.coin.toLowerCase() + ')'] = addrData;
          this.persistenceProvider
            .setAddressBook(addrData.network, JSON.stringify(ab))
            .then(() => {
              this.list(addrData.network)
                .then(ab => {
                  return resolve(ab);
                })
                .catch(err => {
                  return reject(err);
                });
            })
            .catch(() => {
              let msg = this.translate.instant('Error adding new entry');
              return reject(msg);
            });
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public remove(addr: string, network: string, coin: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!network || !coin) {
        const addrData = this.addressProvider.getCoinAndNetwork(addr);
        if (_.isEmpty(addrData)) {
          let msg = this.translate.instant('Not valid bitcoin address');
          return reject(msg);
        }
        network = addrData.network;
        if (!coin) coin = addrData.coin;
      }

      this.persistenceProvider
        .getAddressBook(network)
        .then(ab => {
          if (ab && _.isString(ab)) ab = JSON.parse(ab);
          ab = ab || {};
          if (_.isEmpty(ab)) {
            let msg = this.translate.instant('Addressbook is empty');
            return reject(msg);
          }
          if (!ab[addr + ' (' + coin.toLowerCase() + ')']) {
            let msg = this.translate.instant('Entry does not exist');
            return reject(msg);
          }
          delete ab[addr + ' (' + coin.toLowerCase() + ')'];
          this.persistenceProvider
            .setAddressBook(network, JSON.stringify(ab))
            .then(() => {
              this.list(network)
                .then(ab => {
                  return resolve(ab);
                })
                .catch(err => {
                  return reject(err);
                });
            })
            .catch(() => {
              let msg = this.translate.instant('Error deleting entry');
              return reject(msg);
            });
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public migrateOldContacts(): Promise<boolean> {
    this.logger.info('AddressBookProvider: migrating old contacts');
    return Promise.all([
      this.processNetworkContacts('livenet'),
      this.processNetworkContacts('testnet')
    ])
      .then(() => {
        this.migratingContactsSubject.next(false);
        return Promise.resolve(true);
      })
      .catch(() => {
        this.migratingContactsSubject.next(false);
        return Promise.reject(false);
      });
  }

  public async removeAddressBook() {
    let network = 'livenet';
    let newABFile = await this.persistenceProvider.existsNewAddressBook(
      network
    );
    if (newABFile) {
      await this.persistenceProvider.removeAddressbook(network, true);
    }
    network = 'testnet';
    newABFile = await this.persistenceProvider.existsNewAddressBook(network);
    if (newABFile) {
      await this.persistenceProvider.removeAddressbook(network, true);
    }
  }

  private processNetworkContacts(network: string): Promise<boolean> {
    return new Promise(async resolve => {
      try {
        const newABFile = await this.persistenceProvider.existsNewAddressBook(
          network
        );

        if (!newABFile) {
          this.migratingContactsSubject.next(true);
          const oldContacts = await this.list(network, false);
          if (oldContacts) {
            this.logger.info(
              'AddressBookProvider: got ' +
                oldContacts.length +
                ' old contacts to migrate.'
            );
            let newContactJson = {};
            _.each(oldContacts, old => {
              newContactJson[
                old.address + ' (' + old.coin.toLowerCase() + ')'
              ] = old;
            });
            this.persistenceProvider
              .setAddressBook(network, JSON.stringify(newContactJson), true)
              .then(() => resolve(true))
              .catch(err => {
                this.logger.error(err);
                resolve(false);
              });
          }
        } else {
          this.logger.info('AddressBookProvider: Using new addressBook');
        }
        return resolve(true);
      } catch {
        err => {
          this.logger.error(err);
          resolve(false);
        };
      }
    });
  }
}
