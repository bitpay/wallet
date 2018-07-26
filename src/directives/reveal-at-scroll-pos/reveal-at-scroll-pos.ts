import { Directive, ElementRef, Input, Renderer } from '@angular/core';
import { Content } from 'ionic-angular';

@Directive({
  selector: '[reveal-at-scroll-pos]'
})
export class RevealAtScrollPosition {
  @Input('reveal-at-scroll-pos') scrollThreshold: number;
  @Input('scrollArea') scrollArea: Content;

  animationDistance: number = 28;

  constructor(private element: ElementRef, private renderer: Renderer) {}

  ngAfterViewInit() {
    this.setOpacity(0);
    this.scrollArea.ionScroll.subscribe(event =>
      this.updateStyling(event.scrollTop)
    );
  }

  updateStyling(scrollTop: number) {
    const opacity = this.getOpacity(scrollTop);
    const translateX = this.getTranslation(scrollTop);
    this.setOpacity(opacity);
    this.setTransform(translateX);
  }

  setOpacity(opacity: number) {
    this.renderer.setElementStyle(
      this.element.nativeElement,
      'opacity',
      opacity.toFixed(3)
    );
  }

  setTransform(translateX: number) {
    this.renderer.setElementStyle(
      this.element.nativeElement,
      'transform',
      `translateX(${translateX}px)`
    );
  }

  getOpacity(scrollTop: number) {
    const finalOpacity = 1;
    const fadeStartPosition = this.scrollThreshold - this.animationDistance;
    const m = finalOpacity / (this.scrollThreshold - fadeStartPosition);
    const opacity = m * (scrollTop - this.scrollThreshold) + finalOpacity;
    return opacity;
  }

  getTranslation(scrollTop: number) {
    /*
    point-slope-form
    y-y1 = m(x-x1)
    y = m(x-x1) + y1
      where m = (y2 - y1) / (x2 - x1)

    initialTranslateX = -10
    finalTranslateX = 0
    p1 = (scrollThreshold, finalTranslateX)
    p2 = (animationStartPos, initialTranslateX)
    */
    const initialTranslateX = -10;
    const finalTranslateX = 0;
    const animationStartPos = this.scrollThreshold - this.animationDistance;
    const m =
      (initialTranslateX - finalTranslateX) /
      (animationStartPos - this.scrollThreshold);
    const translateX = m * (scrollTop - this.scrollThreshold) + 0;
    return translateX > 0 ? 0 : translateX;
  }
}
