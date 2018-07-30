import { Component, Input } from '@angular/core';
import { PlatformProvider } from '../../../providers/platform/platform';

@Component({
  selector: 'wide-header-page',
  templateUrl: 'wide-header-page.html'
})
export class WideHeaderPage {
  @Input() headerColor: string;
  @Input() title: string;

  constructor(public platformProvider: PlatformProvider) {}
}
