import { Injectable } from '@angular/core';
import { Clipboard } from '@ionic-native/clipboard';

// providers
import { ElectronProvider } from '../../providers/electron/electron';
import { Logger } from '../../providers/logger/logger';
import { PlatformProvider } from '../../providers/platform/platform';
import { IncomingDataProvider } from '../incoming-data/incoming-data';

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
      return Promise.reject('Not supported for this device');
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
}
