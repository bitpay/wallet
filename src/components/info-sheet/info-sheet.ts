import { Component, ViewChild } from '@angular/core';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';
import { InfoSheetTemplate } from './info-sheet-template';

@Component({
  selector: 'info-sheet',
  templateUrl: 'info-sheet.html'
})
export class InfoSheetComponent extends ActionSheetParent {
  @ViewChild(InfoSheetTemplate) infoSheetTemplate: InfoSheetTemplate;
  constructor() {
    super();
  }
  ngAfterViewInit() {
    this.infoSheetTemplate.onDismiss.subscribe(option => {
      this.dismiss(option);
    });
  }
}

export const INFO_SHEET_COMPONENTS = [InfoSheetComponent, InfoSheetTemplate];
