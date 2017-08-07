import { Injectable } from '@angular/core';
import { PlatformProvider } from '../platform/platform';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';

import { IStorage } from './istorage';

export class KeyAlreadyExistsError extends Error {
  constructor() {
    super('Key already exists');
  }
}

@Injectable()
export class LocalStorage implements IStorage {
  ls: Storage;
  constructor(private platform: PlatformProvider, private log: Logger) {
    this.ls = (typeof window.localStorage !== "undefined") ? window.localStorage : null;
    if (!this.ls) throw new Error('localstorage not available');
  }

  get(k: string, cb: (err: Error, v: string) => void) {
    return cb(null, this.ls.getItem(k));
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
      function (err, data) {
        if (data) {
          return cb(new KeyAlreadyExistsError());
        } else {
          return this.set(k, v, cb);
        }
      })
  }
}
