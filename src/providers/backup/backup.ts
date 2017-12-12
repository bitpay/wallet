import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';

@Injectable()
export class BackupProvider {

  constructor(
    private logger: Logger
  ) {
    this.logger.info('BackupProvider initialized.');
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
