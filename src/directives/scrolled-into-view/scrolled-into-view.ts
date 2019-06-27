import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { Content } from 'ionic-angular';

@Directive({
  selector: '[scrolled-into-view]'
})
export class ScrolledIntoView {
  inView: boolean = false;

  @Input('scrollArea')
  scrollArea: Content;

  @Output()
  viewEnter: EventEmitter<boolean> = new EventEmitter();

  constructor(private elm: ElementRef) {}

  ngAfterViewInit() {
    this.scrollArea.ionScroll.subscribe(({ contentHeight, scrollTop }) => {
      const scanButtonAreaHeight = 70;
      const { offsetTop, offsetHeight } = this.elm.nativeElement;
      if (
        scrollTop + contentHeight - scanButtonAreaHeight >
        offsetTop + offsetHeight
      ) {
        if (this.inView) return;
        this.viewEnter.emit(true);
        this.inView = true;
      }
    });
  }
}
