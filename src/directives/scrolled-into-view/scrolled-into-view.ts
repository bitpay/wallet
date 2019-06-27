import { Directive, ElementRef, Input } from '@angular/core';
import { Content } from 'ionic-angular';

@Directive({
  selector: '[scrolled-into-view]'
})
export class ScrolledIntoView {
  @Input('scrollArea')
  scrollArea: Content;

  constructor(private elm: ElementRef) {}

  ngAfterViewInit() {
    this.scrollArea.ionScroll.subscribe(({ contentHeight, scrollTop }) => {
      const scanButtonAreaHeight = 70;
      const { offsetTop, offsetHeight } = this.elm.nativeElement;
      if (
        scrollTop + contentHeight - scanButtonAreaHeight >
        offsetTop + offsetHeight
      ) {
        console.log('in view');
      }
    });
  }
}
