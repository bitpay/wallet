import { Injectable } from '@angular/core';
import { PlatformProvider } from '../platform/platform';
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

  get(k: string, cb: (err: Error, v: any) => void) {
    let v = this.ls.getItem(k);
    if (!v) return cb(null, null);
    if (!_.isString(v)) return cb(null, v);

    try {
      return cb(null, JSON.parse(v));
    } catch (e) {
      return cb(null, v);
    }
  }

  set(k: string, v: any, cb: (err: Error) => void) {
    if (_.isObject(v)) {
      v = JSON.stringify(v);
    }
    if (v && !_.isString(v)) {
      v = v.toString();
    }

    this.ls.setItem(k, v);
    return cb(null);
  }

  remove(k: string, cb: (err: Error) => void) {
    this.ls.removeItem(k);
    return cb(null);
  }

  create(k: string, v: any, cb: (err: Error) => void) {
    this.get(k,
      (err, data) => {
        if (data) {
          return cb(new KeyAlreadyExistsError());
        } else {
          return this.set(k, v, cb);
        }
      })
  }
}
