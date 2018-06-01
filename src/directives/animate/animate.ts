import { Directive, ElementRef, Renderer } from '@angular/core';

@Directive({
  selector: '[animate]'
})
export class Animate {
  constructor(public el: ElementRef, public renderer: Renderer) {}

  animate(animationName: string) {
    this.renderer.setElementClass(this.el.nativeElement, animationName, true);
    setTimeout(() => {
      this.renderer.setElementClass(
        this.el.nativeElement,
        animationName,
        false
      );
    }, 600);
  }
}
