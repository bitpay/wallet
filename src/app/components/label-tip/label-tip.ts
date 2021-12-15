import { Component, ElementRef, Input, Renderer2 } from '@angular/core';

@Component({
  selector: 'label-tip',
  template: `
    <div class="label-tip" [ngClass]="type ? type : ''">
      <div class="label-header" *ngIf="header !== 'no-header'">
        <img
          *ngIf="type === 'info'"
          class="label-header__icon"
          src="assets/img/icon-info-blue.svg"
        />
        <img
          *ngIf="type === 'warn'"
          class="label-header__icon"
          src="assets/img/icon-warning-circled.svg"
        />
        <img
          *ngIf="type === 'danger'"
          class="label-header__icon"
          src="assets/img/icon-danger.svg"
        />
        <ng-content select="[label-tip-title]"></ng-content>
      </div>
      <div
        [ngClass]="{
          blue: type === 'info',
          yellow: type == 'warn',
          red: type == 'danger'
        }"
      >
        <ng-content select="[label-tip-body]"></ng-content>
      </div>
    </div>
  `,
  styleUrls: ['label-tip.scss']
})
export class LabelTip {
  @Input()
  type: string;
  @Input()
  header: string;

  constructor(private element: ElementRef, private renderer: Renderer2) {}

  ngOnChanges() {
    this.renderer.addClass(this.element.nativeElement, this.type);
  }
}
