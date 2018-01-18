import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

//providers
import { PersistenceProvider } from '../persistence/persistence';

@Injectable()
export class TxConfirmNotificationProvider {

  constructor(
    private logger: Logger,
    private persistenceProvider: PersistenceProvider
  ) {
    this.logger.info('TxConfirmNotificationProvider initialized.');
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
    client.txConfirmationSubscribe(opts, (err: any, res: any) => {
      if (err) this.logger.error(err);
      this.persistenceProvider.setTxConfirmNotification(opts.txid, true).catch((err: any) => {
        this.logger.error(err);
        return;
      });
    });
  };

  public unsubscribe(client: any, txId: string): void {
    client.txConfirmationUnsubscribe(txId, (err: any, res: any) => {
      if (err) this.logger.error(err);
      this.persistenceProvider.removeTxConfirmNotification(txId).catch((err: any) => {
        this.logger.error(err);
        return;
      });
    });
  };

}
