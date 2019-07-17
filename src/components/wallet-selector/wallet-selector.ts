import { Component } from '@angular/core';
import * as _ from 'lodash';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'wallet-selector',
  templateUrl: 'wallet-selector.html'
})
export class WalletSelectorComponent extends ActionSheetParent {
  public walletsGroups;
  public title: string;
  public selectedWalletId: string;

  constructor() {
    super();
  }

  ngOnInit() {
    this.walletsGroups = _.groupBy(this.params.wallets, 'groupName');
    this.title = this.params.title;
    this.selectedWalletId = this.params.selectedWalletId;
  }

  public optionClicked(option): void {
    this.dismiss(option);
  }
}
