import { Component, Input, ViewChild } from '@angular/core';
import { Content } from 'ionic-angular';
import { PlatformProvider } from '../../../providers/platform/platform';

@Component({
  selector: 'wide-header-page',
  templateUrl: 'wide-header-page.html'
})
export class WideHeaderPage {
  @Input()
  headerColor: string;
  @Input()
  title: string;

  @ViewChild(Content)
  scrollArea: Content;

  constructor(public platformProvider: PlatformProvider) {}
}
