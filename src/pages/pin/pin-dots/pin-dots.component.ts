import {
  Component,
  Input,
  QueryList,
  SimpleChanges,
  ViewChildren
} from '@angular/core';

import { Animate } from './../../../directives/animate/animate';

@Component({
  selector: 'pin-dots',
  template: `
    <div
      *ngFor="let dot of dotArray; index as i"
      class="circle"
      [ngClass]="{ filled: isFilled(i + 1) }"
      animate
    ></div>
  `
})
export class PinDots {
  public dotArray = new Array(4);

  @Input()
  pin: string;
  @ViewChildren(Animate)
  dots: QueryList<Animate>;

  ngOnChanges(changes: SimpleChanges) {
    const pinChanges = changes.pin;
    if (!pinChanges) {
      return;
    }
    const currentValue = pinChanges.currentValue;
    const previousValue = pinChanges.previousValue;
    if (!currentValue.length || currentValue.length < previousValue.length) {
      return;
    }
    this.pulseDot(currentValue.length - 1);
  }

  public isFilled(limit): boolean {
    return this.pin && this.pin.length >= limit;
  }

  public pulseDot(dotIndex: number): void {
    const dot = this.dots.toArray()[dotIndex];
    dot.animate('pulse');
  }
}
