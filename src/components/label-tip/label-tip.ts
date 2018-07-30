import { Component, ElementRef, Input, Renderer } from '@angular/core';
import { AlertType } from '../info-sheet/info-sheet-template';

@Component({
  selector: 'label-tip',
  template: `
  <div class="label-header">
    <img *ngIf="type === 'info'" class="label-header__icon" src="assets/img/icon-info-blue.svg">
    <ng-content select="[label-tip-title]"></ng-content>
  </div>
  <ng-content select="[label-tip-body]"></ng-content>
  `
})
export class LabelTip {
  @Input() type: AlertType;

  constructor(private element: ElementRef, private renderer: Renderer) {}

  ngOnChanges() {
    this.renderer.setElementClass(this.element.nativeElement, this.type, true);
  }
}
