import { IStorage, KeyAlreadyExistsError } from './istorage';

export class RamStorage implements IStorage {
  hash = {};

  get(k: string, cb: (err: Error, v: string) => void) {
    return cb(null, this.hash[k]);
  };
  set(k: string, v: any, cb: (err: Error) => void) {
    this.hash[k] = v;
    return cb(null);
  };
  remove(k: string, cb: (err: Error) => void) {
    delete this.hash[k];
    return cb(null);
  };
  create(k: string, v: any, cb: (err: Error) => void) {
    this.get(k,
      (err, data) => {
        if (data) {
          return cb(new KeyAlreadyExistsError());
        } else {
          this.set(k, v, cb);
        }
      })
  };
}
