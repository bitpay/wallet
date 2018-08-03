import { Injectable } from '@angular/core';
import { Clipboard } from '@ionic-native/clipboard';
import { TranslateService } from '@ngx-translate/core';
import { ToastController } from 'ionic-angular';

import * as _ from 'lodash';

// providers
import { IncomingDataProvider } from '../../providers/incoming-data/incoming-data';
import { Logger } from '../../providers/logger/logger';
import { NodeWebkitProvider } from '../../providers/node-webkit/node-webkit';
import { PlatformProvider } from '../../providers/platform/platform';

export interface ClipboardData {
  data: string;
  type: string;
  date: Date;
}

@Injectable()
export class ClipboardProvider {
  private isCordova: boolean;
  private isNW: boolean;
  private values: Array<ClipboardData>;

  constructor(
    public toastCtrl: ToastController,
    public platform: PlatformProvider,
    public logger: Logger,
    public translate: TranslateService,
    private clipboard: Clipboard,
    private nodeWebkitProvider: NodeWebkitProvider,
    private incomingDataProvider: IncomingDataProvider
  ) {
    this.logger.info('ClipboardProvider initialized.');
    this.isCordova = this.platform.isCordova;
    this.isNW = this.platform.isNW;
    this.values = [];
  }

  public process(data: ClipboardData): void {
    let index = _.findIndex(this.values, {date: data.date});
    this.values.splice(index, 1);
    this.incomingDataProvider.redir(data.data);
  }

  public async getData(): Promise<any> {
    let data = await this.paste();
    if (_.findIndex(this.values, {data: data}) != -1) return this.values;
    this.setValue(data);
    this.values = _.orderBy(this.values, ['date'], ['desc']);
    if (this.values.length == 4) this.values.splice(this.values.length - 1, 1);
    return this.values;
  }

  private setValue(value: string): void {
    let parsedInfo = this.incomingDataProvider.parseData(value);
    if (!parsedInfo) return;
    this.values.push({
      data: parsedInfo.data,
      type: parsedInfo.type,
      date: new Date()
    });
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
    this.values = [];
    if (this.isCordova) {
      this.clipboard.copy('');
    } else if (this.isNW) {
      this.nodeWebkitProvider.clearClipboard();
    } else {
      return;
    }
  }

}
