import { DOCUMENT } from "@angular/platform-browser";
import { Directive, Inject } from '@angular/core';
import { ToastController } from 'ionic-angular';
import { Clipboard } from '@ionic-native/clipboard';
import { PlatformProvider } from '../../providers/platform/platform';
import { Logger } from '@nsalaun/ng-logger';

@Directive({
  selector: '[copy-to-clipboard]', // Attribute selector
  inputs: ['value: copy-to-clipboard'],
  host: {
    '(click)': 'copy()'
  }
})
export class CopyToClipboard {

  public value: string;
  private dom: Document;
  private isCordova: boolean;
  private isNW: boolean;

  constructor(
    @Inject(DOCUMENT) dom: Document,
    public toastCtrl: ToastController,
    public clipboard: Clipboard,
    public platform: PlatformProvider,
    public logger: Logger
  ) {
    this.logger.info('CopyToClipboardDirective initialized.');
    this.isCordova = this.platform.isCordova;
    this.isNW = this.platform.isNW;
    this.dom = dom;
  }

  private copyBrowser() {
    let textarea = this.dom.createElement('textarea');
    this.dom.body.appendChild(textarea);
    textarea.value = this.value;
    textarea.select();
    this.dom.execCommand('copy');
  }

  public copy() {
    if (this.isCordova) {
      this.clipboard.copy(this.value);
    } else if (this.isNW) {
      // TODO: Node-webkit won't be supported
    } else {
      this.copyBrowser();
    }
    let showSuccess = this.toastCtrl.create({
      message: 'Copied to clipboard',
      duration: 1000,
    });
    showSuccess.present();
  }

}
