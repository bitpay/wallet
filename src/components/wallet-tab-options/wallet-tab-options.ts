import { Component } from '@angular/core';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'wallet-tab-options-component',
  templateUrl: 'wallet-tab-options.html'
})
export class WalletTabOptionsComponent extends ActionSheetParent {
  public walletsGroups: any;

  constructor() {
    super();
  }
  ngOnInit() {
    this.walletsGroups = this.params.walletsGroups;
  }
}
