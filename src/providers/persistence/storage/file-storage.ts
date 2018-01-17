import { Injectable } from '@angular/core';
import { Logger } from '../../../providers/logger/logger';
import * as _ from 'lodash';
import { File, DirectoryEntry } from '@ionic-native/file';
import { IStorage, KeyAlreadyExistsError } from './istorage';

@Injectable()
export class FileStorage implements IStorage {
  fs: FileSystem;
  dir: DirectoryEntry;

  constructor(
    private file: File,
    private log: Logger
  ) {
  }

  init(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.fs && this.dir) return resolve();

      let onSuccess = (fs: FileSystem): Promise<any> => {
        this.log.debug('File system started: ', fs.name, fs.root.name);
        this.fs = fs;
        return this.getDir().then(dir => {
          if (!dir.nativeURL) return reject();
          this.dir = dir;
          this.log.debug("Got main dir:", dir.nativeURL);
          return resolve();
        });
      };

      let onFailure = (err: Error): Promise<any> => {
        this.log.error('Could not init file system: ' + err.message);
        return Promise.reject(err);
      };

      window.requestFileSystem(1, 0, onSuccess, onFailure);
    });
  }

  // See https://github.com/apache/cordova-plugin-file/#where-to-store-files
  getDir(): Promise<DirectoryEntry> {
    if (!this.file) {
      return Promise.reject(new Error('Could not write on device storage'));
    }

    var url = this.file.dataDirectory;
    return this.file.resolveDirectoryUrl(url)
      .catch(err => {
        let msg = 'Could not resolve filesystem ' + url;
        this.log.warn(msg, err);
        throw err || new Error(msg);
      });
  };

  get(k: string): Promise<any> {
    let parseResult = (v: any): any => {
      if (!v) return null;
      if (!_.isString(v)) return v;
      let parsed: any;
      try {
        parsed = JSON.parse(v);
      } catch (e) {
        this.log.error(e);
      }
      return parsed || v;
    };

    return Promise.resolve(
      this.init().then(() => {
        return Promise.resolve(this.file.getFile(this.dir, k, { create: false }));
      })
        .then(fileEntry => {
          if (!fileEntry) return;
          return new Promise((resolve) => {
            fileEntry.file(file => {
              var reader = new FileReader();
              reader.onloadend = () => {
                resolve(parseResult(reader.result));
              }
              reader.readAsText(file);
            });
          });
        })
        .catch(err => {
          // Not found
          if (err.code == 1) return;
          else throw err;
        })
    );
  }

  set(k: string, v: any): Promise<void> {
    return this.init()
      .then(() => {
        return this.file.getFile(this.dir, k, { create: true });
      })
      .then(fileEntry => {
        // Create a FileWriter object for our FileEntry (log.txt).
        return new Promise<void>((resolve, reject) => {
          fileEntry.createWriter(fileWriter => {
            fileWriter.onwriteend = (e) => {
              this.log.info('Write completed:' + k);
              resolve();
            };

            fileWriter.onerror = (e) => {
              this.log.error('Write failed', e);
              reject(e);
            };

            if (_.isObject(v))
              v = JSON.stringify(v);

            if (v && !_.isString(v)) {
              v = v.toString();
            }

            this.log.debug('Writing:', k, v);
            fileWriter.write(v);
          }, err => {
            this.log.error('Could not create writer', err);
            reject(err);
          });
        });
      });
  };

  remove(k: string): Promise<void> {
    return Promise.resolve();
  }

  create(k: string, v: any): Promise<void> {
    return this.get(k).then((data) => {
      if (data) throw new KeyAlreadyExistsError();
      this.set(k, v);
    });
  }
}
