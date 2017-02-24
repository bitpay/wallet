import { Injectable } from '@angular/core';
import { Logger } from 'angular2-logger/core';

import lodash from 'lodash';

@Injectable()
export class FileStorageService {
  //var root = {},
  win: any = window;
  cordova: any = this.win.cordova;
  localFileSystem: any = this.win.LocalFileSystem;
  _fs: any;
  _dir: any;
  writelock: any = {};

  constructor(public logger: Logger) {}

  init(cb) {
    if (this._dir) return cb(null, this._fs, this._dir);

    let onFileSystemSuccess = (fileSystem) => {
      this.logger.log('File system started: ', fileSystem.name, fileSystem.root.name);
      this._fs = fileSystem;
      this.getDir((err, newDir) => {
        if (err || !newDir.nativeURL) return cb(err);
        this._dir = newDir;
        this.logger.debug('Got main dir:', this._dir.nativeURL);
        return cb(null, this._fs, this._dir);
      });
    }

    let fail = (evt) => {
      var msg = 'Could not init file system: ' + evt.target.error.code;
      this.logger.error(msg);
      return cb(msg);
    };

    this.win.requestFileSystem(this.localFileSystem.PERSISTENT, 0, onFileSystemSuccess, fail);
  }

  get(k, cb) {
    this.init((err, fs, dir) => {
      if (err) return cb(err);
      dir.getFile(k, {
        create: false,
      }, (fileEntry) => {
        if (!fileEntry) return cb();
        fileEntry.file((file) => {
          var reader = new FileReader();

          reader.onloadend = function(e) {
            return cb(null, this.result)
          }

          reader.readAsText(file);
        });
      }, (err) => {
        // Not found
        if (err.code == 1) return cb();
        else return cb(err);
      });
    })
  };

  set(k, v, cb, delay?) {

    delay = delay || 100;

    if (this.writelock[k]) {
      return setTimeout(() => {
        this.logger.log('## Writelock for:' + k + ' Retrying in ' + delay);
        return this.set(k, v, cb, delay + 100);
      }, delay);
    }

    this.writelock[k] = true;
    this.init((err, fs, dir) => {
      if (err) {
        this.writelock[k] = false;
        return cb(err);
      }
      dir.getFile(k, {
        create: true,
      }, (fileEntry) => {
        // Create a FileWriter object for our FileEntry (log.txt).
        fileEntry.createWriter((fileWriter) => {

          fileWriter.onwriteend = (e) => {
            this.logger.log('Write completed:' + k);
            this.writelock[k] = false;
            return cb();
          };

          fileWriter.onerror = (e) => {
            var err = e.error ? e.error : JSON.stringify(e);
            this.logger.log('Write failed: ' + err);
            this.writelock[k] = false;
            return cb('Fail to write:' + err);
          };

          if (lodash.isObject(v))
            v = JSON.stringify(v);

          if (!lodash.isString(v)) {
            v = v.toString();
          }

          this.logger.debug('Writing:', k, v);
          fileWriter.write(v);

        }, cb);
      });
    });
  };


  // See https://github.com/apache/cordova-plugin-file/#where-to-store-files
  getDir(cb) {
    if (!this.cordova.file) {
      return cb('Could not write on device storage');
    }

    let url = this.cordova.file.dataDirectory;
    // This could be needed for this.wins
    // if (cordova.file === undefined) {
    //   url = 'ms-appdata:///local/';
    this.win.resolveLocalFileSystemURL(url, (dir) => {
      return cb(null, dir);
    }, (err) => {
      this.logger.warn(err);
      return cb(err || 'Could not resolve filesystem:' + url);
    });
  };

  remove(k, cb) {
    this.init((err, fs, dir) => {
      if (err) return cb(err);
      dir.getFile(k, {
        create: false,
      }, (fileEntry) => {
        // Create a FileWriter object for our FileEntry (log.txt).
        fileEntry.remove(() => {
          this.logger.log('File removed.');
          return cb();
        }, cb);
      }, cb);
    });
  };

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
  };

 }
