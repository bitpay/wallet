import { Component, Input } from '@angular/core';

@Component({
  selector: 'wide-header-page',
  templateUrl: 'wide-header-page.html'
})
export class WideHeaderPage {
  @Input() headerColor: string;
  @Input() title: string;
}
