import { Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Gesture } from 'ionic-angular/gestures/gesture';
declare var Hammer: any;

import { ProfileProvider } from '../../providers/profile/profile';

@Directive({
  selector: '[longPress]'
})
export class LongPress implements OnInit, OnDestroy {
  public el: HTMLElement;
  public pressGesture: Gesture;

  @Output()
  public longPress: EventEmitter<any> = new EventEmitter();

  constructor(
    el: ElementRef, 
    profileProvider: ProfileProvider
  ) {
    this.el = el.nativeElement;
  }

  public ngOnInit() {
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

  public ngOnDestroy() {
    this.pressGesture.destroy();
  }
}