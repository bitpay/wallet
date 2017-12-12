import { Injectable } from '@angular/core';
import { BwcProvider } from '../bwc/bwc';
import { Logger } from '@nsalaun/ng-logger';
import { PersistenceProvider } from '../../providers/persistence/persistence';

import * as _ from 'lodash';

@Injectable()
export class AddressBookProvider {

  constructor(
    private bwcProvider: BwcProvider,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
  ) {
    this.logger.info('AddressBookProvider initialized.');
  }

  private getNetwork(address: string): string {
    let network;
    try {
      network = (this.bwcProvider.getBitcore().Address(address)).network.name;
    } catch (e) {
      this.logger.warn('No valid bitcoin address. Trying bitcoin cash...');
      network = (this.bwcProvider.getBitcoreCash().Address(address)).network.name;
    }
    return network;
  };

  public get(addr: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider.getAddressbook('testnet').then((ab: any) => {
        if (ab && _.isString(ab)) ab = JSON.parse(ab);
        if (ab && ab[addr]) return resolve(ab[addr]);

        this.persistenceProvider.getAddressbook('livenet').then((ab: any) => {
          if (ab && _.isString(ab)) ab = JSON.parse(ab);
          if (ab && ab[addr]) return resolve(ab[addr]);
          return resolve();
        }).catch((err: any) => {
          return reject();
        });
      }).catch((err: any) => {
        return reject();
      });
    })
  };

  public list(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider.getAddressbook('testnet').then((ab: any) => {
        if (ab && _.isString(ab)) ab = JSON.parse(ab);

        ab = ab || {};
        this.persistenceProvider.getAddressbook('livenet').then((ab2: any) => {
          if (ab2 && _.isString(ab)) ab2 = JSON.parse(ab2);

          ab2 = ab2 || {};
          return resolve(_.defaults(ab2, ab));
        }).catch((err: any) => {
          return reject(err);
        });
      }).catch((err: any) => {
        return reject('Could not get the Addressbook');
      });
    });
  };

  public add(entry: any): Promise<any> {
    return new Promise((resolve, reject) => {
      var network = this.getNetwork(entry.address);
      if (_.isEmpty(network)) return reject('Not valid bitcoin address');
      this.persistenceProvider.getAddressbook(network).then((ab: any) => {
        if (ab && _.isString(ab)) ab = JSON.parse(ab);
        ab = ab || {};
        if (_.isArray(ab)) ab = {}; // No array
        if (ab[entry.address]) return reject('Entry already exist');
        ab[entry.address] = entry;
        this.persistenceProvider.setAddressbook(network, JSON.stringify(ab)).then((ab: any) => {
          this.list().then((ab: any) => {
            return resolve(ab);
          }).catch((err: any) => {
            return reject(err);
          });
        }).catch((err: any) => {
          return reject('Error adding new entry');
        });
      }).catch((err: any) => {
        return reject(err);
      });
    });
  };

  public remove(addr: any): Promise<any> {
    return new Promise((resolve, reject) => {
      var network = this.getNetwork(addr);
      if (_.isEmpty(network)) return reject('Not valid bitcoin address');
      this.persistenceProvider.getAddressbook(network).then((ab: any) => {
        if (ab && _.isString(ab)) ab = JSON.parse(ab);
        ab = ab || {};
        if (_.isEmpty(ab)) return reject('Addressbook is empty');
        if (!ab[addr]) return reject('Entry does not exist');
        delete ab[addr];
        this.persistenceProvider.setAddressbook(network, JSON.stringify(ab)).then(() => {
          this.list().then((ab: any) => {
            return resolve(ab);
          }).catch((err: any) => {
            return reject(err);
          });
        }).catch(() => {
          return reject('Error deleting entry');
        });
      }).catch((err: any) => {
        return reject(err);
      });
    });
  };

  public removeAll(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider.removeAddressbook('livenet').then(() => {
        this.persistenceProvider.removeAddressbook('testnet').then(() => {
          return resolve();
        });
      }).catch(() => {
        return reject('Error deleting addressbook');
      }).catch(() => {
        return reject('Error deleting addressbook');
      });
    });
  };

}
