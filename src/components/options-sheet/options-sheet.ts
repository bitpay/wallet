import { Component } from '@angular/core';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'options-sheet',
  templateUrl: 'options-sheet.html'
})
export class OptionsSheetComponent extends ActionSheetParent {
  public sheetType: string;
  constructor() {
    super();
  }

  public optionClicked(option): void {
    this.dismiss(option);
  }
}
