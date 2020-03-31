import { Component } from '@angular/core';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

import { StatusBar } from '@ionic-native/status-bar';

import { PlatformProvider } from '../../providers/platform/platform';
@Component({
  selector: 'options-sheet',
  templateUrl: 'options-sheet.html'
})
export class OptionsSheetComponent extends ActionSheetParent {
  constructor(
    private platformProvider: PlatformProvider,
    private statusBar: StatusBar
  ) {
    super();
  }

  ngOnInit() {
    if (this.platformProvider.isIOS) {
      this.statusBar.hide();
    }
  }

  ngOnDestroy() {
    if (this.platformProvider.isIOS) {
      this.statusBar.show();
    }
  }

  public optionClicked(option): void {
    this.dismiss(option);
  }
}
