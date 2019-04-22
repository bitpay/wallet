import { Component } from '@angular/core';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'wallet-group-selector',
  templateUrl: 'wallet-group-selector.html'
})
export class WalletGroupSelectorComponent extends ActionSheetParent {
  public walletGroups;
  public selectedWalletGroupId: string;

  constructor() {
    super();
  }

  ngOnInit() {
    this.walletGroups = this.params.walletGroups;
    this.selectedWalletGroupId = this.params.selectedWalletGroupId;
  }

  public optionClicked(option): void {
    this.dismiss(option);
  }
}
