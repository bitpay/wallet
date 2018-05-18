import { Component, Input } from '@angular/core';

@Component({
  selector: 'pin-dots',
  template: `
    <div *ngFor="let dot of dots; index as i" class="circle" [ngClass]="{filled: isFilled(i+1)}"></div>
  `
})
export class PinDots {
  private dots = new Array(4);
  @Input() pin: string;

  public isFilled(limit): boolean {
    return this.pin && this.pin.length >= limit;
  }
}
