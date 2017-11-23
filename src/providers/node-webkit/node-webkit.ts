import { Injectable } from '@angular/core';

@Injectable()
export class NodeWebkitProvider {

  constructor() {
    console.log('Hello NodeWebkitProvider Provider');
  }

  public readFromClipboard(): any {
    /* DEPRECATED
    let gui = require('nw.gui');
    let clipboard = gui.Clipboard.get();
    return clipboard.get();
     */
  };

  public writeToClipboard(text): any {
    /* DEPRECATED
    let gui = require('nw.gui');
    let clipboard = gui.Clipboard.get();
    return clipboard.set(text);
     */
  };

  public openExternalLink(url): any {
    /* DEPRECATED
    let gui = require('nw.gui');
    return gui.Shell.openExternal(url);
     */
  };
}
