import { Directive, ElementRef, Input } from '@angular/core';

/* 
Ionic does not currently appear to provide an API to set the navbar background
to an arbitrary color. This directive enables this functionality.
*/

@Directive({
  selector: '[navbar-bg]'
})
export class NavbarBg {
  @Input('navbar-bg')
  color: string;

  constructor(private element: ElementRef) {}

  ngOnChanges() {
    this.setNewNavbarColor(this.color);
  }

  setNewNavbarColor(color: string): void {
    const toolbarBg = this.element.nativeElement.getElementsByClassName(
      'toolbar-background'
    )[0];
    color
      ? toolbarBg.style.setProperty('background', color, 'important')
      : toolbarBg.style.removeProperty('background');
  }
}
