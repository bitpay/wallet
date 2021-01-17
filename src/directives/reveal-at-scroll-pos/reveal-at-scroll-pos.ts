import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';
import { Content } from 'ionic-angular';

@Directive({
  selector: '[reveal-at-scroll-pos]'
})
export class RevealAtScrollPosition {
  @Input('reveal-at-scroll-pos')
  scrollThreshold: number;
  @Input('scrollArea')
  scrollArea: Content;

  scrollPositionOfLastStyleUpdate: number = 0;
  animationDistance: number = 28;

  constructor(private element: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit() {
    this.setInitialStyles();
    this.scrollArea.ionScroll.subscribe(
      event =>
        this.shouldUpdateStyling(event.scrollTop) &&
        this.updateStyling(event.scrollTop)
    );
  }

  shouldUpdateStyling(scrollTop: number) {
    return (
      scrollTop < this.scrollThreshold ||
      (scrollTop > this.scrollThreshold &&
        this.scrollPositionOfLastStyleUpdate < this.scrollThreshold)
    );
  }

  setInitialStyles() {
    this.setOpacity(0);
    this.renderer.addClass(this.element.nativeElement, 'ellipsis');
  }

  updateStyling(scrollTop: number) {
    const opacity = this.getOpacity(scrollTop);
    const translateX = this.getTranslation(scrollTop);
    this.setOpacity(opacity);
    this.setTransform(translateX);
    this.scrollPositionOfLastStyleUpdate = scrollTop;
  }

  setOpacity(opacity: number) {
    this.renderer.setStyle(
      this.element.nativeElement,
      'opacity',
      opacity.toFixed(3)
    );
  }

  setTransform(translateX: number) {
    this.renderer.setStyle(
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
