import { Injectable } from '@angular/core';
import { Logger } from 'angular2-logger/core';

import { PlatformInfo } from './platform-info.service';

import lodash from 'lodash';

@Injectable()
export class LocalStorageService {

  win: any = window;
  chrome: any = this.win.chrome;
  isNW: boolean = false;
  isChromeApp: boolean = false;
  root: any = {};
  ls: any;

  constructor(
    public logger: Logger,
    public platformInfo: PlatformInfo
  ) {
    this.isNW = this.platformInfo.isNW;
    this.isChromeApp = this.platformInfo.isChromeApp;
    this.ls = ((typeof this.win.localStorage !== "undefined") ? this.win.localStorage : null);
    if (this.isChromeApp && !this.isNW && !this.ls) {
      this.logger.info('Using CHROME storage');
      this.ls = this.chrome.storage.local;
    }

    if (!this.ls)
      throw new Error('localstorage not available');

    if (this.isNW) {
      this.logger.info('Overwritting localstorage with chrome storage for NW.JS');

      var ts = this.ls.getItem('migrationToChromeStorage');
      var p = this.ls.getItem('profile');

      // Need migration?
      if (!ts && p) {
        this.logger.info('### MIGRATING DATA! TO CHROME STORAGE');

        var j = 0;
        for (var i = 0; i < localStorage.length; i++) {
          var k = this.ls.key(i);
          var v = this.ls.getItem(k);

          this.logger.debug('   Key: ' + k);
          this.set(k, v, () => {
            j++;
            if (j == localStorage.length) {
              this.logger.info('### MIGRATION DONE');
              this.ls.setItem('migrationToChromeStorage', Date.now())
              this.ls = this.chrome.storage.local;
            }
          })
        }
      } else if (p) {
        this.logger.info('# Data already migrated to Chrome storage on ' + ts);
      }
    }
  }

  get(k, cb) {
    if (this.isChromeApp || this.isNW) {
      this.chrome.storage.local.get(k,
        (data) => {
          //TODO check for errors
          return cb(null, data[k]);
        });
    } else {
      return cb(null, this.ls.getItem(k));
    }
  }

  /**
   * Same as setItem, but fails if an item already exists
   */
  create(name, value, callback) {
    this.get(name,
      (err, data) => {
        if (data) {
          return callback('EEXISTS');
        } else {
          return this.set(name, value, callback);
        }
      });
  }

  set(k, v, cb) {
    if (this.isChromeApp || this.isNW) {
      var obj = {};

      if (lodash.isObject(v)) {
        v = JSON.stringify(v);
      }
      if (!lodash.isString(v)) {
        v = v.toString();
      }

      obj[k] = v;

      this.chrome.storage.local.set(obj, cb);
    } else {
      this.ls.setItem(k, v);
      return cb();
    }

  };

  remove(k, cb) {
    if (this.isChromeApp || this.isNW) {
      this.chrome.storage.local.remove(k, cb);
    } else {
      this.ls.removeItem(k);
      return cb();
    }

  };


}
