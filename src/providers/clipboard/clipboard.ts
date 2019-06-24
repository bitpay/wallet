import { Injectable } from '@angular/core';
import { Clipboard } from '@ionic-native/clipboard';
import { TranslateService } from '@ngx-translate/core';
import { ToastController } from 'ionic-angular';

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
    public toastCtrl: ToastController,
    public platform: PlatformProvider,
    public logger: Logger,
    public translate: TranslateService,
    private clipboard: Clipboard,
    private electronProvider: ElectronProvider,
    private incomingDataProvider: IncomingDataProvider
  ) {
    this.logger.debug('ClipboardProvider initialized');
    this.isCordova = this.platform.isCordova;
    this.isElectron = this.platform.isElectron;
  }

  public async getData(): Promise<any> {
    return this.paste();
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

  private async paste(): Promise<any> {
    if (this.isCordova) {
      return this.clipboard.paste();
    } else if (this.isElectron) {
      return this.electronProvider.readFromClipboard();
    } else {
      this.logger.warn('Paste from clipboard not supported');
      return;
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
    this.getData().then(data => {
      const validDataFromClipboard = this.incomingDataProvider.parseData(data);
      if (
        validDataFromClipboard &&
        typeArray.indexOf(validDataFromClipboard.type) != -1
      ) {
        this.logger.info('Cleaning clipboard data');
        this.clear(); // clear clipboard data if exist
      }
    });
  }
}
