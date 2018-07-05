import { Component } from '@angular/core';
import { OptionsSheetComponent } from '../options-sheet/options-sheet';

@Component({
  selector: 'receive-options',
  templateUrl: 'receive-options.html'
})
export class ReceiveOptionsSheetComponent extends OptionsSheetComponent {
  public showShare: boolean;
  constructor() {
    super();
  }
}
