import { Injectable } from '@angular/core';
import { PlatformProvider } from '../../platform/platform';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';

import { IStorage, KeyAlreadyExistsError } from './istorage';

@Injectable()
export class LocalStorage implements IStorage {
  ls: Storage;
  constructor(private platform: PlatformProvider, private log: Logger) {
    this.ls = (typeof window.localStorage !== "undefined") ? window.localStorage : null;
    if (!this.ls) throw new Error('localstorage not available');
  }

  get(k: string): Promise<any> {
    return new Promise((resolve) => {
      let v = this.ls.getItem(k);
      if (!v) return resolve(null);
      if (!_.isString(v)) return resolve(v);
      let parsed: any;
      try {
        parsed = JSON.parse(v);
      } catch (e) {
      }
      resolve(parsed || v);
    });
  }

  set(k: string, v: any): Promise<void> {
    return new Promise<void>(() => {
      if (_.isObject(v)) {
        v = JSON.stringify(v);
      }
      if (v && !_.isString(v)) {
        v = v.toString();
      }

      this.ls.setItem(k, v);
    });
  }

  remove(k: string): Promise<void> {
    return new Promise<void>(() => {
      this.ls.removeItem(k);
    });
  }

  create(k: string, v: any): Promise<void> {
    return this.get(k).then((data) => {
      if (data) throw new KeyAlreadyExistsError();
      this.set(k, v);
    });
  }
}
