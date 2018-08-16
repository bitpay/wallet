import { IStorage, KeyAlreadyExistsError } from './istorage';

export class RamStorage implements IStorage {
  hash = {};

  constructor() {}

  get(k: string): Promise<any> {
    return Promise.resolve(this.hash[k]);
  }
  set(k: string, v): Promise<void> {
    return new Promise<void>(resolve => {
      this.hash[k] = v;
      resolve();
    });
  }
  remove(k: string): Promise<void> {
    return new Promise<void>(resolve => {
      delete this.hash[k];
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
