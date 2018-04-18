import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class NodeWebkitProvider {

  constructor(
    private logger: Logger
  ) {
    this.logger.info('NodeWebkitProvider initialized.');
  }

  public readFromClipboard(): any {
    let gui = (window as any).require('nw.gui');
    let clipboard = gui.Clipboard.get();
    return clipboard.get();
  };

  public writeToClipboard(text): any {
    let gui = (window as any).require('nw.gui');
    let clipboard = gui.Clipboard.get();
    return clipboard.set(text);
  };

  public openExternalLink(url): any {
    let gui = (window as any).require('nw.gui');
    return gui.Shell.openExternal(url);
  };
}
