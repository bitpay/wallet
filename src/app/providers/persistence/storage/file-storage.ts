import { Injectable, NgZone } from '@angular/core';
import { fakeAsync } from '@angular/core/testing';
import { DirectoryEntry, File, FileSystem } from '@ionic-native/file/ngx';
import * as _ from 'lodash';
import { Logger } from '../../logger/logger';
import { IStorage, KeyAlreadyExistsError } from './istorage';

@Injectable({
  providedIn: 'root'
})

export class FileStorage implements IStorage {
  fs: FileSystem;
  dir: DirectoryEntry;
  constructor(private file: File, private log: Logger) { }

  init(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.fs && this.dir) return resolve(undefined);

      const onSuccess = (fs: FileSystem): Promise<any> => {
        this.log.debug('File system started: ', fs.name, fs.root.name);
        this.fs = fs;
        return this.getDir().then(dir => {
          if (!dir.nativeURL) return reject();
          this.dir = dir;
          this.log.debug('Got main dir:', dir.nativeURL);
          return resolve(undefined);
        });
      };

      const onFailure = (err: Error): Promise<any> => {
        this.log.error('Could not init file system: ' + err.message);
        return Promise.reject(err);
      };

      (window as any).requestFileSystem(1, 0, onSuccess, onFailure);
    });
  }

  // See https://github.com/apache/cordova-plugin-file/#where-to-store-files
  getDir(): Promise<DirectoryEntry> {
    if (!this.file) {
      return Promise.reject(new Error('Could not write on device storage'));
    }

    const url = this.file.dataDirectory;
    return this.file.resolveDirectoryUrl(url).catch(err => {
      const msg = 'Could not resolve filesystem ' + url;
      this.log.warn(msg, err);
      throw err || new Error(msg);
    });
  }

  parseResult(v) {
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

  readFileEntry(fileEntry): Promise<any> {
    return new Promise((resolve, reject) => {
      fileEntry.file(file => {
        let reader = new FileReader();
        const zoneOriginalInstance = (reader as any)["__zone_symbol__originalInstance"];
        zoneOriginalInstance.onerror = () => {
          zoneOriginalInstance.abort();
          return reject();
        };

        zoneOriginalInstance.onloadend = () => {
          return resolve(this.parseResult(zoneOriginalInstance.result));
        };

        zoneOriginalInstance.readAsText(file);
      });
    });
  }

  exists(k: string): Promise<boolean> {
    return new Promise(resolve => {
      this.init()
        .then(() => {
          this.file
            .getFile(this.dir, k, { create: false })
            .then(() => resolve(true))
            .catch(err => {
              this.log.error(err);
              return resolve(false);
            });
        })
        .catch(err => {
          this.log.error(err);
          return resolve(false);
        });
    });
  }

  get(k: string): Promise<any> {
    return new Promise(resolve => {
      this.init()
        .then(() => {
          this.file
            .getFile(this.dir, k, { create: false })
            .then(fileEntry => {
              if (!fileEntry) return resolve(undefined);

              this.readFileEntry(fileEntry)
                .then(result => {
                  return resolve(result);
                })
                .catch(() => {
                  this.log.error('Problem parsing input file.');
                });
            })
            .catch(err => {
              // Not found
              if (err.code == 1) return resolve(undefined);
              else throw err;
            });
        })
        .catch(err => {
          this.log.error(err);
        });
    });
  }

  set(k: string, v): Promise<void> {
    return Promise.resolve(
      this.init().then(() => {
        this.file.getFile(this.dir, k, { create: true }).then(fileEntry => {
          // Create a FileWriter object for our FileEntry (log.txt).
          return new Promise((resolve, reject) => {
            fileEntry.createWriter(fileWriter => {
              fileWriter.onwriteend = () => {
                this.log.debug('Successful file write...');
                return resolve(undefined);
              };

              fileWriter.onerror = e => {
                this.log.error('Failed file write: ' + e.toString());
                return reject(e.toString());
              };

              if (_.isObject(v)) v = JSON.stringify(v);
              if (!_.isString(v)) v = v.toString();
              fileWriter.write(v);
            });
          });
        });
      })
    );
  }

  remove(k: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.file
        .removeFile(this.dir.nativeURL, k)
        .then(() => {
          this.log.debug(`Storage Key: ${k} removed`);
          resolve();
        })
        .catch(e => {
          reject(e);
        });
    });
  }

  create(k: string, v): Promise<void> {
    return this.get(k).then(data => {
      if (data) throw new KeyAlreadyExistsError();
      this.set(k, v);
    });
  }

  readAsText(path, file): Promise<any> {
    return this.file.resolveDirectoryUrl(path).then(directoryEntry => {
      return this.file
        .getFile(directoryEntry, file, { create: false })
        .then(fileEntry => {
          let reader = new FileReader();
          reader = (reader as any)["__zone_symbol__originalInstance"];
          return new Promise((resolve, reject) => {
            reader.onloadend = function () {
              if (reader.result !== undefined || reader.result !== null) {
                resolve(reader.result);
              }
              else if (reader.error !== undefined || reader.error !== null) {
                reject(reader.error);
              }
              else {
                reject({ code: null, message: 'READER_ONLOADEND_ERR' });
              }
            };
            fileEntry.file(function (file) {
              reader["readAs" + 'Text'].call(reader, file);
            }, function (error) {
              reject(error);
            });
          });
        })
        .catch(err => {
          throw err;
        });
    }).
      catch(err => {
        const msg = 'Could not resolve filesystem ' + path;
        throw err || new Error(msg);
      });
  }
}
