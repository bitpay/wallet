import { Injectable } from '@angular/core';
import * as _ from 'lodash';

import { Logger } from '../../logger/logger';
import { IStorage, KeyAlreadyExistsError } from './istorage';

@Injectable()
export class LocalStorage implements IStorage {
  ls;

  constructor(private logger: Logger) {
    if (!window.localStorage) throw new Error('localstorage not available');
    this.ls = window.localStorage;
  }

  processValue(v) {
    if (!v) return null;
    if (!_.isString(v)) return v;
    let parsed;
    try {
      parsed = JSON.parse(v);
    } catch (e) {
      // TODO parse is not necessary
    }
    return parsed || v;
  }

  get(k: string): Promise<any> {
    return new Promise(resolve => {
      let v = this.ls.getItem(k);
      return resolve(this.processValue(v));
    });
  }

  set(k: string, v): Promise<void> {
    return new Promise<void>(resolve => {
      if (_.isObject(v)) v = JSON.stringify(v);
      if (!_.isString(v)) v = v.toString();
      this.ls.setItem(k, v);
      resolve();
    });
  }

  remove(k: string): Promise<void> {
    return new Promise<void>(resolve => {
      this.ls.removeItem(k);
      this.logger.debug(`Storage Key: ${k} removed`);
      resolve();
    });
  }

  create(k: string, v): Promise<void> {
    return this.get(k).then(data => {
      if (data) throw new KeyAlreadyExistsError();
      this.set(k, v);
    });
  }
}
