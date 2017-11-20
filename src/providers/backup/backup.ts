import { Injectable } from '@angular/core';

@Injectable()
export class BackupProvider {

  constructor() {
    console.log('Hello BackupProvider Provider');
    //TODO
  }

  public walletDownload(val1, val2): Promise<any> {
    //TODO
    return new Promise((resolve, reject) => {
      resolve();
    })
  }

  public walletExport(val1, val2) {
    //TODO
    return
  }
}
