import { Directive, ElementRef, Input } from '@angular/core';

/* 
Sometimes the user can overshoot when scrolling, which can cause gaps to appear between
elements if colors are not properly set on the fixed and scroll containers to match the colors
of surrounding elements. This directive sets the proper bg-color on the fixed and scroll containers
to create the illusion of smooth, fluid, and connected elements.
*/

@Directive({
  selector: '[fixed-scroll-bg-color]',
  host: { class: 'fixed-scroll-bg-color' }
})
export class FixedScrollBgColor {
  @Input('fixed-scroll-bg-color')
  color: string;
  @Input()
  bottomColor: string = '#f8f8f9';

  constructor(private element: ElementRef) {}

  ngOnChanges() {
    this.setFixedAndScrollContentBgColor(this.color);
  }

  setFixedAndScrollContentBgColor(color: string): void {
    const scrollContent = this.element.nativeElement.getElementsByClassName(
      'scroll-content'
    )[0];
    const fixedContent = this.element.nativeElement.getElementsByClassName(
      'fixed-content'
    )[0];

    const linearGradient = `linear-gradient(to bottom, ${this.color}, ${
      this.color
    } 50%, ${this.bottomColor} 50%, ${this.bottomColor} 50%, ${
      this.bottomColor
    } 50%)`;

    if (color) {
      scrollContent.style.setProperty('background-image', linearGradient);
      fixedContent.style.setProperty('background-image', linearGradient);
    } else {
      scrollContent.style.removeProperty('background-image');
      fixedContent.style.removeProperty('background-image');
    }
  }
}
