import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { IonContent } from '@ionic/angular';
import _ from 'lodash';

@Directive({
  selector: '[scrolled-into-view]'
})
export class ScrolledIntoView {
  inView: boolean = false;

  @Input('scrollArea')
  scrollArea: IonContent;

  @Output()
  viewEnter: EventEmitter<boolean> = new EventEmitter();

  constructor(private elm: ElementRef) { }

  ngAfterViewInit() {
    this.checkIfElementInView();
    this.scrollArea.ionScroll.subscribe((el) => this.checkIfElementInView(el));
  }
  checkIfElementInView(el?: any) {
    const scanButtonAreaHeight = 70;
    const contentHeight = _.get(this.scrollArea, 'el.offsetHeigh', 0);
    const scrollTop = el ? el.detail.scrollTop : 0;
    const { offsetTop, offsetHeight } = this.elm.nativeElement;
    if (
      scrollTop + contentHeight - scanButtonAreaHeight >
      offsetTop + offsetHeight
    ) {
      if (this.inView) return;
      this.viewEnter.emit(true);
      this.inView = true;
    }
  }
}
