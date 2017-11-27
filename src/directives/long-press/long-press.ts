import { Directive, ElementRef, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Gesture } from 'ionic-angular/gestures/gesture';
declare var Hammer: any;

import { ProfileProvider } from '../../providers/profile/profile';

@Directive({
  selector: '[longPress]'
})
export class LongPress implements OnInit, OnDestroy {
  el: HTMLElement;
  pressGesture: Gesture;

  @Output()
  longPress: EventEmitter<any> = new EventEmitter();

  constructor(
    el: ElementRef, 
    profileProvider: ProfileProvider
  ) {
    this.el = el.nativeElement;
  }

  ngOnInit() {
    this.pressGesture = new Gesture(this.el, {
      recognizers: [
        [Hammer.Press, { time: 1000 }]
      ]
    });
    this.pressGesture.listen();
    this.pressGesture.on('press', e => {
      this.longPress.emit(e);
    })
  }

  ngOnDestroy() {
    this.pressGesture.destroy();
  }
}