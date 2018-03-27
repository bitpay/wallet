import { Directive, Inject } from '@angular/core';
import { DOCUMENT } from "@angular/platform-browser";
import { Clipboard } from '@ionic-native/clipboard';
import { TranslateService } from '@ngx-translate/core';
import { ToastController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';
import { PlatformProvider } from '../../providers/platform/platform';

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
    public logger: Logger,
    public translate: TranslateService
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
    if (!this.value) {
      return;
    }
    if (this.isCordova) {
      this.clipboard.copy(this.value);
    } else if (this.isNW) {
      // TODO: Node-webkit won't be supported
    } else {
      this.copyBrowser();
    }
    let showSuccess = this.toastCtrl.create({
      message: this.translate.instant('Copied to clipboard'),
      duration: 1000,
      position: 'top'
    });
    showSuccess.present();
  }

}
