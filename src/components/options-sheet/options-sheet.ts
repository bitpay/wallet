import { Component } from '@angular/core';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'options-sheet',
  templateUrl: 'options-sheet.html'
})
export class OptionsSheetComponent extends ActionSheetParent {
  constructor() {
    super();
  }

  public optionClicked(option): void {
    this.dismiss(option);
  }
}
