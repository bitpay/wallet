import { InjectionToken } from '@angular/core';

export interface IStorage {
  get(k: string): Promise<any>;
  set(k: string, v): Promise<void>;
  remove(k: string): Promise<void>;
  create(k: string, v): Promise<void>;
}

export class KeyAlreadyExistsError extends Error {
  constructor() {
    super('Key already exists');
  }
}

export let ISTORAGE = new InjectionToken<IStorage>('storage');
