import { Injectable } from '@angular/core';

@Injectable()
export class OnGoingProcessProvider {

  constructor() {
    console.log('Hello OnGoingProcessProvider Provider');
  }

  public set (processName: string, isOn: boolean, customHandler?: any) {
    console.log('TODO: OnGoingProcessProvider set()...');
  }

}
