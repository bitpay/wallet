import { Directive, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[animate]'
})
export class Animate {
  constructor(public el: ElementRef, public renderer: Renderer2) {}

  animate(animationName: string) {
    this.renderer.addClass(this.el.nativeElement, animationName);
    setTimeout(() => {
      this.renderer.removeClass(this.el.nativeElement, animationName);
    }, 600);
  }
}
