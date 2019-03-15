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
    // Set toolbar background
    const toolbarBg = this.element.nativeElement.getElementsByClassName(
      'toolbar-background'
    )[0];

    color
      ? toolbarBg.style.setProperty('background', color, 'important')
      : toolbarBg.style.removeProperty('background');

    // Set back button color
    const backButton = this.element.nativeElement.getElementsByClassName(
      'back-button'
    )[0];

    if (backButton) {
      color
        ? backButton.style.setProperty('color', 'white', 'important')
        : backButton.style.removeProperty('color');
    }

    // Set modal close button color
    const modalCloseButton = this.element.nativeElement.getElementsByClassName(
      'modal-close-button'
    )[0];

    if (modalCloseButton) {
      color
        ? modalCloseButton.style.setProperty('color', 'white', 'important')
        : modalCloseButton.style.removeProperty('color');
    }

    // Set toolbar title color
    const toolbarTitle = this.element.nativeElement.getElementsByClassName(
      'toolbar-title'
    )[0];

    if (toolbarTitle) {
      color
        ? toolbarTitle.style.setProperty('color', 'white', 'important')
        : toolbarTitle.style.removeProperty('color');
    }

    // Set toolbar content color

    const toolbarContent = this.element.nativeElement.getElementsByClassName(
      ' toolbar-content'
    )[0];

    if (toolbarContent) {
      color
        ? toolbarContent.style.setProperty('color', 'white', 'important')
        : toolbarContent.style.removeProperty('color');
    }
  }
}
