import { Directive, ElementRef, Input } from '@angular/core';

/* 
Ionic does not currently appear to provide an API to set the navbar background
to an aribitrary color. This directive enables this functionality.
*/

@Directive({
  selector: '[navbar-bg]'
})
export class NavbarBg {
  @Input('navbar-bg') color: string;

  constructor(private elem: ElementRef) {}

  ngOnChanges(changes) {
    if (changes && changes.color.currentValue) {
      this.setNewNavbarColor(this.color);
    }
  }

  setNewNavbarColor(color: string): void {
    const toolbarBg = this.elem.nativeElement.getElementsByClassName(
      'toolbar-background'
    )[0];
    toolbarBg.style.setProperty('background', color, 'important');
  }
}
