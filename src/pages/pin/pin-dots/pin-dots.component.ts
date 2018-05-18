import { Component, Input } from '@angular/core';

@Component({
  selector: 'pin-dots',
  template: `
    <div *ngFor="let dotIndex of dots" class="circle" [ngClass]="{filled: isFilled(dotIndex)}"></div>
  `
})
export class PinDots {
  private dots = [1, 2, 3, 4];
  @Input() pin: string;

  public isFilled(limit): boolean {
    return this.pin && this.pin.length >= limit;
  }
}
