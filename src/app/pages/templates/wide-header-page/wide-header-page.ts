import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { IonContent, IonToolbar } from '@ionic/angular';
import { PlatformProvider } from 'src/app/providers/platform/platform';

@Component({
  selector: 'wide-header-page',
  templateUrl: 'wide-header-page.html',
  styleUrls: ['wide-header-page.scss']
})
export class WideHeaderPage {

  @Output() back = new EventEmitter();

  @Input()
  headerColor: string;

  @Input()
  title: string;

  @Input()
  subTitle: string;

  @Input()
  img: string;

  @Input()
  isCustomBack?: boolean | any;
  
  @Input()
  hideToolbar: boolean | any;

  @Input()
  hideBackButton: boolean | any;

  @Input()
  hideTopTitle: boolean | any;

  @Input()
  hasSlideButton: boolean | any;

  @ViewChild(IonToolbar)
  navBar: IonToolbar;

  @ViewChild(IonContent)
  scrollArea: IonContent;

  constructor(
    public platformProvider: PlatformProvider
  ) { 
    window['myCustomMethod'] = this.overide;
  }
  overide = () => {
    this.back.emit();
  }
}
