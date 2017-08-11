import { IStorage, KeyAlreadyExistsError } from './istorage';
import { PlatformProvider } from '../../platform/platform';
import { Logger } from '@nsalaun/ng-logger';

export class RamStorage implements IStorage {
  hash = {};

  constructor(private platform: PlatformProvider, private log: Logger) { }

  get(k: string): Promise<any> {
    return Promise.resolve(this.hash[k]);
  };
  set(k: string, v: any): Promise<void> {
    return Promise.resolve().then(() => { this.hash[k] = v });
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
