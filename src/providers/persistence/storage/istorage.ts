import { InjectionToken } from '@angular/core';

export interface IStorage {
  get(k: string, cb: (err: Error, v: any) => void);
  set(k: string, v: any, cb: (err: Error) => void);
  remove(k: string, cb: (err: Error) => void);
  create(k: string, v: any, cb: (err: Error) => void);
}

export class KeyAlreadyExistsError extends Error {
  constructor() {
    super('Key already exists');
  }
}

export let ISTORAGE = new InjectionToken<IStorage>('storage');
