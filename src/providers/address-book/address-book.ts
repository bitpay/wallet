import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { BwcProvider } from '../bwc/bwc';

import * as _ from 'lodash';

@Injectable()
export class AddressBookProvider {
  constructor(
    private bwcProvider: BwcProvider,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private translate: TranslateService
  ) {
    this.logger.info('AddressBookProvider initialized.');
  }

  private getNetwork(address: string): string {
    let network;
    try {
      network = this.bwcProvider.getBitcore().Address(address).network.name;
    } catch (e) {
      this.logger.warn('No valid bitcoin address. Trying bitcoin cash...');
      network = this.bwcProvider.getBitcoreCash().Address(address).network.name;
    }
    return network;
  }

  public get(addr: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider
        .getAddressbook('testnet')
        .then((ab: any) => {
          if (ab && _.isString(ab)) ab = JSON.parse(ab);
          if (ab && ab[addr]) return resolve(ab[addr]);

          this.persistenceProvider
            .getAddressbook('livenet')
            .then((ab: any) => {
              if (ab && _.isString(ab)) ab = JSON.parse(ab);
              if (ab && ab[addr]) return resolve(ab[addr]);
              return resolve();
            })
            .catch((err: any) => {
              return reject();
            });
        })
        .catch((err: any) => {
          return reject();
        });
    });
  }

  public list(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider
        .getAddressbook('testnet')
        .then((ab: any) => {
          if (ab && _.isString(ab)) ab = JSON.parse(ab);

          ab = ab || {};
          this.persistenceProvider
            .getAddressbook('livenet')
            .then((ab2: any) => {
              if (ab2 && _.isString(ab)) ab2 = JSON.parse(ab2);

              ab2 = ab2 || {};
              return resolve(_.defaults(ab2, ab));
            })
            .catch((err: any) => {
              return reject(err);
            });
        })
        .catch((err: any) => {
          let msg = this.translate.instant('Could not get the Addressbook');
          return reject(msg);
        });
    });
  }

  public add(entry: any): Promise<any> {
    return new Promise((resolve, reject) => {
      var network = this.getNetwork(entry.address);
      if (_.isEmpty(network)) {
        let msg = this.translate.instant('Not valid bitcoin address');
        return reject(msg);
      }
      this.persistenceProvider
        .getAddressbook(network)
        .then((ab: any) => {
          if (ab && _.isString(ab)) ab = JSON.parse(ab);
          ab = ab || {};
          if (_.isArray(ab)) ab = {}; // No array
          if (ab[entry.address]) {
            let msg = this.translate.instant('Entry already exist');
            return reject(msg);
          }
          ab[entry.address] = entry;
          this.persistenceProvider
            .setAddressbook(network, JSON.stringify(ab))
            .then((ab: any) => {
              this.list()
                .then((ab: any) => {
                  return resolve(ab);
                })
                .catch((err: any) => {
                  return reject(err);
                });
            })
            .catch((err: any) => {
              let msg = this.translate.instant('Error adding new entry');
              return reject(msg);
            });
        })
        .catch((err: any) => {
          return reject(err);
        });
    });
  }

  public remove(addr: any): Promise<any> {
    return new Promise((resolve, reject) => {
      var network = this.getNetwork(addr);
      if (_.isEmpty(network)) {
        let msg = this.translate.instant('Not valid bitcoin address');
        return reject(msg);
      }
      this.persistenceProvider
        .getAddressbook(network)
        .then((ab: any) => {
          if (ab && _.isString(ab)) ab = JSON.parse(ab);
          ab = ab || {};
          if (_.isEmpty(ab)) {
            let msg = this.translate.instant('Addressbook is empty');
            return reject(msg);
          }
          if (!ab[addr]) {
            let msg = this.translate.instant('Entry does not exist');
            return reject(msg);
          }
          delete ab[addr];
          this.persistenceProvider
            .setAddressbook(network, JSON.stringify(ab))
            .then(() => {
              this.list()
                .then((ab: any) => {
                  return resolve(ab);
                })
                .catch((err: any) => {
                  return reject(err);
                });
            })
            .catch(() => {
              let msg = this.translate.instant('Error deleting entry');
              return reject(msg);
            });
        })
        .catch((err: any) => {
          return reject(err);
        });
    });
  }

  public removeAll(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider
        .removeAddressbook('livenet')
        .then(() => {
          this.persistenceProvider.removeAddressbook('testnet').then(() => {
            return resolve();
          });
        })
        .catch(() => {
          let msg = this.translate.instant('Error deleting addressbook');
          return reject(msg);
        })
        .catch(() => {
          let msg = this.translate.instant('Error deleting addressbook');
          return reject(msg);
        });
    });
  }
}
