import { Component, ComponentRef, ViewEncapsulation } from '@angular/core';
import { DomProvider } from 'src/app/providers';
import { InfoSheetType } from 'src/app/providers/action-sheet/action-sheet';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';
import { InfoSheetComponent } from '../info-sheet/info-sheet';

@Component({
  selector: 'multisign-info',
  templateUrl: './multisign-info.component.html',
  styleUrls: ['./multisign-info.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MultisignInfoComponent extends ActionSheetParent {

  constructor() {
    super();
   }


}
