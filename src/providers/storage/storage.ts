import { Injectable } from '@angular/core';

@Injectable()
export class StorageProvider {

  constructor() {
    console.log('Hello StorageService Provider');
  }

  public get(key:string):string {
    return key;
  }
}
