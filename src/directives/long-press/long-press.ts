import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { Gesture } from 'ionic-angular/gestures/gesture';
declare var Hammer: any;

@Directive({
  selector: '[long-press]'
})
export class LongPress implements OnInit, OnDestroy {
  el: HTMLElement;
  pressGesture: Gesture;

  constructor(el: ElementRef) {
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
      console.log('pressed!!');
    })
  }

  ngOnDestroy() {
    console.log('destroyed');
    this.pressGesture.destroy();
  }
}