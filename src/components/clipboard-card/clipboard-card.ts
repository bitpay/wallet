import { Component, Input } from '@angular/core';

@Component({
  selector: 'page-clipboard-card',
  templateUrl: 'clipboard-card.html'
})
export class ClipboardCardPage {
  @Input()
  validDataFromClipboard;
  @Input()
  payProDetailsData;
  @Input()
  remainingTimeStr;

  constructor() {}
}
