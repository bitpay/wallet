import { Directive, ElementRef, Input, Renderer } from '@angular/core';
import { Content } from 'ionic-angular';

@Directive({
  selector: '[reveal-at-scroll-pos]'
})
export class RevealAtScrollPosition {
  @Input('reveal-at-scroll-pos') scrollThreshold: number;
  @Input('scrollArea') scrollArea: Content;

  constructor(private element: ElementRef, private renderer: Renderer) {}

  ngAfterViewInit() {
    this.setOpacity(0);
    this.scrollArea.ionScroll.subscribe(event =>
      this.updateStyling(event.scrollTop)
    );
  }

  updateStyling(scrollTop: number) {
    const opacity = this.getOpacity(scrollTop);
    this.setOpacity(opacity);
  }

  setOpacity(opacity: number) {
    this.renderer.setElementStyle(
      this.element.nativeElement,
      'opacity',
      opacity.toFixed(3)
    );
  }

  getOpacity(scrollTop: number) {
    const startFadeAt = this.scrollThreshold - 15;
    const m = 1 / (this.scrollThreshold - startFadeAt);
    const opacity = m * (scrollTop - this.scrollThreshold) + 1;
    return opacity;
  }
}
