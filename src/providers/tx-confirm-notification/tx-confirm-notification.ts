import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { PersistenceProvider } from '../persistence/persistence';

@Injectable()
export class TxConfirmNotificationProvider {

  constructor(
    private logger: Logger,
    private persistenceProvider: PersistenceProvider
  ) {
    console.log('Hello TxConfirmNotificationProvider Provider');
  }

  public checkIfEnabled(txid: string): Promise<any> {
    return new Promise((resolve, reject) => {
    this.persistenceProvider.getTxConfirmNotification(txid).then((res: any) => {
      return resolve(!!res);
    }).catch((err: any) => {
      this.logger.error(err);
      return reject(err);
    });
    });    
  };

  public subscribe(client: any, opts: any): void {
    client.txConfirmationSubscribe(opts).then((res: any) => {
      this.persistenceProvider.setTxConfirmNotification(opts.txid, true).catch((err: any) => {
      this.logger.error(err);
      return;
    });
    }).catch((err: any) => {
      this.logger.error(err);
      return;
    });
  };

  public unsubscribe(client: any, txId: string): void {
    client.txConfirmationUnsubscribe(txId).then((res: any) => {
      this.persistenceProvider.removeTxConfirmNotification(txId).catch((err: any) => {
      this.logger.error(err);
      return;
    });
    }).catch((err: any) => {
      this.logger.error(err);
      return;
    });
  };

}
