import { IStorage, KeyAlreadyExistsError } from './istorage';

export class RamStorage implements IStorage {
  public hash = {};

  constructor() {
  }

  public get(k: string): Promise<any> {
    return Promise.resolve(this.hash[k]);
  };
  public set(k: string, v: any): Promise<void> {
    return new Promise<void>(resolve => {
      this.hash[k] = v;
      resolve();
    });
  };
  public remove(k: string): Promise<void> {
    return new Promise<void>(resolve => {
      delete this.hash[k];
      resolve();
    });
  };
  public create(k: string, v: any): Promise<void> {
    return this.get(k).then((data) => {
      if (data) { throw new KeyAlreadyExistsError(); }
      this.set(k, v);
    });
  };
}
