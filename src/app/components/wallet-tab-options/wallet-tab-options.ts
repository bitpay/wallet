import { Component, ViewEncapsulation } from '@angular/core';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'wallet-tab-options-component',
  templateUrl: 'wallet-tab-options.html',
  styleUrls: ['wallet-tab-options.scss'],
  encapsulation: ViewEncapsulation.None
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
