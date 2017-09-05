import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';

import { IStorage, KeyAlreadyExistsError } from './istorage';

@Injectable()
export class ChromeStorage implements IStorage {
  ls: chrome.storage.StorageArea;
  constructor(private log: Logger) {
    let chrome: any;
    if (!chrome.storage || !chrome.storage.local) throw new Error('Chrome storage not supported');
    this.ls = chrome.storage.local;
  }

  get(k: string): Promise<any> {
    return new Promise(resolve => {
      let v = this.ls.get(k, (v) => {
        if (!v) return resolve(null);
        if (!_.isString(v)) return resolve(v);
        let parsed: any;
        try {
          parsed = JSON.parse(v);
        } catch (e) {
        }
        resolve(parsed || v);
      });
    });
  }

  set(k: string, v: any): Promise<void> {
    if (_.isObject(v)) {
      v = JSON.stringify(v);
    }
    if (v && !_.isString(v)) {
      v = v.toString();
    }

    let obj = {};
    obj[k] = v;
    return new Promise<void>(resolve => {
      this.ls.set(obj, resolve);
    });
  }

  remove(k: string): Promise<void> {
    return new Promise<void>(resolve => {
      this.ls.remove(k, resolve);
    });
  }

  create(k: string, v: any): Promise<void> {
    return this.get(k).then((data) => {
      if (data) throw new KeyAlreadyExistsError();
      this.set(k, v);
    });
  }
}
