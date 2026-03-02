import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class ElectronProvider {
  constructor(private logger: Logger) {
    this.logger.debug('ElectronProvider initialized');
  }

  public readFromClipboard() {
    const { clipboard } = (window as any).require('electron');
    return clipboard.readText();
  }

  public writeToClipboard(text) {
    const { clipboard } = (window as any).require('electron');
    return clipboard.writeText(text);
  }

  public clearClipboard() {
    const { clipboard } = (window as any).require('electron');
    clipboard.clear();
  }

  public openExternalLink(url) {
    const { shell } = (window as any).require('electron');
    return shell.openExternal(url);
  }
}
