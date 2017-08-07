import { InjectionToken } from '@angular/core';

export interface IStorage {
  get(k: string, cb: (err: Error, v: string) => void);
  set(k: string, v: any, cb: (err: Error) => void);
  remove(k: string, cb: (err: Error) => void);
  create(k: string, v: any, cb: (err: Error) => void);
}

export let ISTORAGE = new InjectionToken<IStorage>('storage');
