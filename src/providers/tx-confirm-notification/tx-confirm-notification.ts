import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// providers
import { PersistenceProvider } from '../persistence/persistence';

@Injectable()
export class TxConfirmNotificationProvider {
  constructor(
    private logger: Logger,
    private persistenceProvider: PersistenceProvider
  ) {
    this.logger.debug('TxConfirmNotificationProvider initialized');
  }

  public checkIfEnabled(txid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider
        .getTxConfirmNotification(txid)
        .then(res => {
          return resolve(!!res);
        })
        .catch(err => {
          this.logger.error(err);
          return reject(err);
        });
    });
  }

  public subscribe(client, opts): void {
    client.txConfirmationSubscribe(opts, err => {
      if (err) this.logger.error(err);
      this.persistenceProvider
        .setTxConfirmNotification(opts.txid, true)
        .catch(err => {
          this.logger.error(err);
          return;
        });
    });
  }

  public unsubscribe(client, txId: string): void {
    client.txConfirmationUnsubscribe(txId, err => {
      if (err) this.logger.error(err);
      this.persistenceProvider.removeTxConfirmNotification(txId).catch(err => {
        this.logger.error(err);
        return;
      });
    });
  }
}
