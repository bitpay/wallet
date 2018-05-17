import { Directive, ElementRef, Renderer } from '@angular/core';

@Directive({
  selector: '[shake]'
})
export class Shake {
  constructor(public el: ElementRef, public renderer: Renderer) {}

  shakeIt() {
    this.renderer.setElementClass(this.el.nativeElement, 'shake', true);
    setTimeout(() => {
      this.renderer.setElementClass(this.el.nativeElement, 'shake', false);
    }, 600);
  }
}
