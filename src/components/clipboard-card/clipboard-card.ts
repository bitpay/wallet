import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

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

  constructor(public translate: TranslateService) {}
}
