import {
  Directive,
  ElementRef,
  Input,
  AfterViewInit,
  NgZone,
  EventEmitter,
  Output
} from "@angular/core";
import { Gesture, GestureController } from "@ionic/angular";

@Directive({
  selector: '[longPress]'
})
export class LongPress {

  @Output()  longPress: EventEmitter<any> = new EventEmitter();
  @Input("delay") delay = 1000;
  action: any; //not stacking actions

  private longPressActive = false;
  gesture: Gesture;
  constructor(
    private el: ElementRef,
    private gestureCtrl: GestureController,
    private zone: NgZone
  ) { }

  ngOnInit() {
    this.loadLongPressOnElement();
  }

  loadLongPressOnElement() {
    this.gesture = this.gestureCtrl.create({
      el: this.el.nativeElement,
      threshold: 0,
      gestureName: 'long-press',
      onStart: ev => {
        this.longPressActive = true;
        this.longPressAction();
      },
      onEnd: ev => {
        this.longPressActive = false;
      }
    });
    this.gesture.enable(true);
  }

  private longPressAction() {
    if (this.action) {
      clearInterval(this.action);
    }
    this.action = setTimeout(() => {
      this.zone.run(() => {
        if (this.longPressActive === true) {
          this.longPressActive = false;
          this.longPress.emit();
        }
      });
    }, this.delay);
  }

  ngOnDestroy() {
    this.gesture.destroy();
  }
}
