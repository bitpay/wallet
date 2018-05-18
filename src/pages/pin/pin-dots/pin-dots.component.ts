import { Component, Input } from '@angular/core';

@Component({
  selector: 'pin-dots',
  template: `
    <div class="circle" [ngClass]="getFilledClass(1)"></div>
    <div class="circle" [ngClass]="getFilledClass(2)"></div>
    <div class="circle" [ngClass]="getFilledClass(3)"></div>
    <div class="circle" [ngClass]="getFilledClass(4)"></div>
  `
})
export class PinDots {
  @Input() pin: string;

  public getFilledClass(limit): string {
    return this.pin.length >= limit ? 'filled' : null;
  }
}
