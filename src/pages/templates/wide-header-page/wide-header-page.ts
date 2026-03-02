import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, ViewChild } from '@angular/core';
import { Content, Navbar } from 'ionic-angular';
import { PlatformProvider } from '../../../providers/platform/platform';

@Component({
  selector: 'wide-header-page',
  templateUrl: 'wide-header-page.html',
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({
          transform: 'translateY(5px)',
          opacity: 0
        }),
        animate('400ms')
      ])
    ])
  ]
})
export class WideHeaderPage {
  @Input()
  headerColor: string;

  @Input()
  title: string;

  @Input()
  hideBackButton: boolean;

  @Input()
  hasSlideButton: boolean;

  @ViewChild(Navbar)
  navBar: Navbar;

  @ViewChild(Content)
  scrollArea: Content;

  @Input()
  merchantName?: string;

  constructor(public platformProvider: PlatformProvider) {}
}
