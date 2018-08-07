import { Injectable } from '@angular/core';
import { Clipboard } from '@ionic-native/clipboard';
import { TranslateService } from '@ngx-translate/core';
import { ToastController } from 'ionic-angular';

// providers
import { Logger } from '../../providers/logger/logger';
import { NodeWebkitProvider } from '../../providers/node-webkit/node-webkit';
import { PlatformProvider } from '../../providers/platform/platform';

@Injectable()
export class ClipboardProvider {
  private isCordova: boolean;
  private isNW: boolean;

  constructor(
    public toastCtrl: ToastController,
    public platform: PlatformProvider,
    public logger: Logger,
    public translate: TranslateService,
    private clipboard: Clipboard,
    private nodeWebkitProvider: NodeWebkitProvider
  ) {
    this.logger.info('ClipboardProvider initialized.');
    this.isCordova = this.platform.isCordova;
    this.isNW = this.platform.isNW;
  }

  public async getData(): Promise<any> {
    let data = await this.paste();
    return data;
  }

  public copy(value: string) {
    if (this.isCordova) {
      this.clipboard.copy(value);
    } else if (this.isNW) {
      this.nodeWebkitProvider.writeToClipboard(value);
    } else {
      throw new Error('Copied to Clipboard using a Web Browser.');
    }
  }

  private async paste(): Promise<any> {
    if (this.isCordova) {
      return this.clipboard.paste();
    } else if (this.isNW) {
      return this.nodeWebkitProvider.readFromClipboard();
    } else {
      this.logger.warn('Paste from clipboard not supported');
      return;
    }
  }

  public clear() {
    if (this.isCordova) {
      this.clipboard.copy(null);
    } else if (this.isNW) {
      this.nodeWebkitProvider.clearClipboard();
    } else {
      return;
    }
  }
}
