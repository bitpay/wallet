import { Directive, ElementRef, Input } from '@angular/core';

/* 
iOS allows the user to overshoot when scrolling, which can cause gaps to appear between
elements if colors are not properly set on the scroll container to match the colors
of surrounding elements. This directive sets the proper bg-color on the scroll container
to create the illusion of smooth, fluid, and connected elements.
*/

@Directive({
  selector: '[ios-scroll-bg-color]',
  host: { class: 'ios-scroll-bg-color' }
})
export class IosScrollBgColor {
  @Input('ios-scroll-bg-color') color: string;
  @Input() bottomColor: string = '#f8f8f9';

  constructor(private element: ElementRef) {}

  ngOnChanges() {
    this.setScrollContentBackgroundColor(this.color);
  }

  setScrollContentBackgroundColor(color: string): void {
    const scrollContent = this.element.nativeElement.getElementsByClassName(
      'scroll-content'
    )[0];
    const linearGradient = `linear-gradient(to bottom, ${this.color}, ${
      this.color
    } 50%, ${this.bottomColor} 50%, ${this.bottomColor} 50%, ${
      this.bottomColor
    } 50%)`;

    color
      ? scrollContent.style.setProperty('background-image', linearGradient)
      : scrollContent.style.removeProperty('background-image');
  }
}
