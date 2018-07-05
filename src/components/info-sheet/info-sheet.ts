import { Component } from '@angular/core';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'info-sheet',
  templateUrl: 'info-sheet.html'
})
export class InfoSheetComponent extends ActionSheetParent {
  public sheetType: string;
  public sheetTitle: string;
  public sheetText: string;
  public btnText: string;
  constructor() {
    super();
  }
}
