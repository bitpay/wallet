import { Directive, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { TranslateService } from '@ngx-translate/core';
import { PlatformProvider } from 'src/app/providers/platform/platform';
import { Logger } from 'src/app/providers/logger/logger';
import { ActionSheetProvider } from 'src/app/providers/action-sheet/action-sheet';
import { ClipboardProvider } from 'src/app/providers/clipboard/clipboard';

// providers


@Directive({
  selector: '[copy-to-clipboard]', // Attribute selector
  inputs: ['value: copy-to-clipboard', 'hideToast: hide-toast'],
  host: {
    '(click)': 'copy()'
  }
})
export class CopyToClipboard {
  public value: string;
  public hideToast: boolean;
  private dom: Document;

  constructor(
    @Inject(DOCUMENT) dom: Document,
    public clipboard: Clipboard,
    public platform: PlatformProvider,
    public logger: Logger,
    public translate: TranslateService,
    private actionSheetProvider: ActionSheetProvider,
    private clipboardProvider: ClipboardProvider
  ) {
    this.dom = dom;
  }

  private copyBrowser() {
    let textarea = this.dom.createElement('textarea');
    this.dom.body.appendChild(textarea);
    textarea.value = this.value;
    textarea.select();
    this.dom.execCommand('copy');
    this.dom.body.removeChild(textarea);
  }

  public copy() {
    if (!this.value) return;
    try {
      this.clipboardProvider.copy(this.value);
    } catch (e) {
      if (e) this.logger.warn(e.message);
      this.copyBrowser();
    }
    if (this.hideToast) return;

    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'copy-to-clipboard',
      { msg: this.value }
    );
    infoSheet.present();
  }
}
