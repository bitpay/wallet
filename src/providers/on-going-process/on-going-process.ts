import { Injectable } from '@angular/core';

@Injectable()
export class OnGoingProcess {

  constructor() {
    console.log('Hello OnGoingProcess Provider');
  }

  public set(processName: string, isOn: boolean, customHandler?: any) {
    console.log('TODO: OnGoingProcess set()...');
  }

}
