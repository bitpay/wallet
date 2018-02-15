import { Injectable } from '@angular/core';
import * as _ from 'lodash';

import { IStorage, KeyAlreadyExistsError } from './istorage';

@Injectable()
export class LocalStorage implements IStorage {
  public ls: Storage;
  constructor() {
    this.ls =
      typeof window.localStorage !== 'undefined' ? window.localStorage : null;
    if (!this.ls) {
      throw new Error('localstorage not available');
    }
  }

  public get(k: string): Promise<any> {
    return new Promise(resolve => {
      const v = this.ls.getItem(k);
      if (!v) {
        return resolve(null);
      }
      if (!_.isString(v)) {
        return resolve(v);
      }
      let parsed: any;
      try {
        parsed = JSON.parse(v);
      } catch (e) {
        //TODO parse is not necessary
      }
      resolve(parsed || v);
    });
  }

  public set(k: string, v: any): Promise<void> {
    return new Promise<void>(resolve => {
      if (_.isObject(v)) {
        v = JSON.stringify(v);
      }
      if (v && !_.isString(v)) {
        v = v.toString();
      }

      this.ls.setItem(k, v);
      resolve();
    });
  }

  public remove(k: string): Promise<void> {
    return new Promise<void>(resolve => {
      this.ls.removeItem(k);
      resolve();
    });
  }

  public create(k: string, v: any): Promise<void> {
    return this.get(k).then(data => {
      if (data) {
        throw new KeyAlreadyExistsError();
      }
      this.set(k, v);
    });
  }
}
