import { AfterViewInit, Directive, ElementRef, Renderer2 } from '@angular/core';
import { PlatformProvider } from '../../../providers';

@Directive({
  selector: '[wide-header-bar-button]'
})
export class WideHeaderBarButton implements AfterViewInit {
  private platformName: 'ios' | 'md' = 'md';

  constructor(
    private element: ElementRef,
    private platformProvider: PlatformProvider,
    private renderer: Renderer2
  ) {
    this.platformName = this.platformProvider.isIOS ? 'ios' : 'md';
  }

  ngAfterViewInit() {
    const cssClasses = [
      'bar-button',
      `bar-button-${this.platformName}`,
      'bar-button-default',
      `bar-button-default-${this.platformName}`
    ];
    cssClasses.forEach(c => this.addClass(c));
  }

  addClass(cssClass: string) {
    this.renderer.addClass(this.element.nativeElement, cssClass);
  }
}
