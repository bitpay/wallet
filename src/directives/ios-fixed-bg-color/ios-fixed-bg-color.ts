import { Directive, ElementRef, Input } from '@angular/core';

/* 
iOS allows the user to overshoot when scrolling, which can cause gaps to appear between
elements if colors are not properly set on the fixed container to match the colors
of surrounding elements. This directive sets the proper bg-color on the fixed container
to create the illusion of smooth, fluid, and connected elements.
*/

@Directive({
  selector: '[ios-fixed-bg-color]',
  host: { class: 'ios-fixed-bg-color' }
})
export class IosFixedBgColor {
  @Input('ios-fixed-bg-color')
  color: string;
  @Input()
  bottomColor: string = '#f8f8f9';

  constructor(private element: ElementRef) {}

  ngOnChanges() {
    this.setFixedContentBackgroundColor(this.color);
  }

  setFixedContentBackgroundColor(color: string): void {
    const fixedContent = this.element.nativeElement.getElementsByClassName(
      'fixed-content'
    )[0];

    const linearGradient = `linear-gradient(to bottom, ${this.color}, ${
      this.color
    } 50%, ${this.bottomColor} 50%, ${this.bottomColor} 50%, ${
      this.bottomColor
    } 50%)`;

    color
      ? fixedContent.style.setProperty('background-image', linearGradient)
      : fixedContent.style.removeProperty('background-image');
  }
}
