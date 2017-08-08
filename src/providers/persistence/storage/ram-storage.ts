import { IStorage, KeyAlreadyExistsError } from './istorage';

export class RamStorage implements IStorage {
  hash = {};

  get(k: string): Promise<any> {
    return Promise.resolve(this.hash[k]);
  };
  set(k: string, v: any): Promise<void> {
    return Promise.resolve().then(() => this.hash[k] = v);
  };
  remove(k: string): Promise<void> {
    return Promise.resolve().then(() => { delete this.hash[k]; });
  };
  create(k: string, v: any): Promise<void> {
    return this.get(k).then((data) => {
      if (data) throw new KeyAlreadyExistsError();
      this.set(k, v);
    });
  };
}
