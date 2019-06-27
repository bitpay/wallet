import { Directive, Input } from '@angular/core';
import { Content } from 'ionic-angular';

@Directive({
  selector: '[scrolled-into-view]'
})
export class ScrolledIntoView {
  @Input('scrollArea')
  scrollArea: Content;

  constructor() {}

  ngAfterViewInit() {
    this.scrollArea.ionScroll.subscribe(event => {
      console.log('scroll', event.scrollTop);
    });
  }
}
