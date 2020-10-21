import { Injectable } from '@angular/core';
import { Clipboard } from '@ionic-native/clipboard';

import * as _ from 'lodash';

// providers
import { ElectronProvider } from '../../providers/electron/electron';
import { Logger } from '../../providers/logger/logger';
import { PlatformProvider } from '../../providers/platform/platform';
import { IncomingDataProvider } from '../incoming-data/incoming-data';

const validDataByCoin = {
  paypro: ['InvoiceUri', 'PayPro', 'BitPayUri'],
  btc: ['BitcoinUri', 'BitcoinAddress'],
  bch: ['BitcoinCashUri', 'BitcoinCashAddress'],
  eth: ['EthereumUri', 'EthereumAddress'],
  xrp: ['RippleUri', 'RippleAddress']
};

@Injectable()
export class ClipboardProvider {
  private isCordova: boolean;
  private isElectron: boolean;

  constructor(
    public platformProvider: PlatformProvider,
    public logger: Logger,
    private clipboard: Clipboard,
    private electronProvider: ElectronProvider,
    private incomingDataProvider: IncomingDataProvider
  ) {
    this.logger.debug('ClipboardProvider initialized');
    this.isCordova = this.platformProvider.isCordova;
    this.isElectron = this.platformProvider.isElectron;
  }

  public async getData(): Promise<any> {
    if (this.isCordova) {
      return this.clipboard.paste();
    } else if (this.isElectron) {
      return this.electronProvider.readFromClipboard();
    } else {
      let text;
      try {
        text = (navigator as any).clipboard.readText();
      } catch (error) {
        return Promise.reject('Not supported for this device');
      }
      return text;
    }
  }

  public copy(value: string) {
    if (this.isCordova) {
      this.clipboard.copy(value);
    } else if (this.isElectron) {
      this.electronProvider.writeToClipboard(value);
    } else {
      throw new Error('Copied to Clipboard using a Web Browser.');
    }
  }

  public clear(): void {
    if (this.isCordova) {
      this.clipboard.copy(null);
    } else if (this.isElectron) {
      this.electronProvider.clearClipboard();
    }
  }

  public clearClipboardIfValidData(typeArray: string[]): void {
    this.getData()
      .then(data => {
        const validDataFromClipboard = this.incomingDataProvider.parseData(
          data
        );
        if (
          validDataFromClipboard &&
          typeArray.indexOf(validDataFromClipboard.type) != -1
        ) {
          this.logger.info('Cleaning clipboard data: done');
          this.clear(); // clear clipboard data if exist
        }
      })
      .catch(err => {
        this.logger.debug('Cleaning clipboard data: ', err);
      });
  }

  public getValidData(coin?): Promise<any> {
    return new Promise(resolve => {
      this.getData()
        .then(data => {
          if (_.isEmpty(data)) return resolve();
          const dataFromClipboard = this.incomingDataProvider.parseData(data);
          if (!dataFromClipboard) return resolve();

          // Check crypto/paypro uri
          if (
            validDataByCoin['paypro'].indexOf(dataFromClipboard.type) > -1 ||
            validDataByCoin[coin].indexOf(dataFromClipboard.type) > -1
          ) {
            return resolve(dataFromClipboard.data);
          }
        })
        .catch(err => {
          this.logger.warn('Clipboard Warning: ', err);
          resolve();
        });
    });
  }
}
