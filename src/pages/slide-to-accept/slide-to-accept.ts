import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, Renderer, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

@Component({
  selector: 'page-slide-to-accept',
  templateUrl: 'slide-to-accept.html',
})
export class SlideToAcceptPage implements AfterViewInit {
  @Output() slideDone = new EventEmitter<boolean>();

  @Input() buttonText: string;

  @Input()
  set disabled(disabled: boolean) {
    this.isDisabled = (disabled !== undefined) ? disabled : false;
  };
  get disabled() {
    return this.isDisabled;
  }
  @Input()
  set slideButtonDone(done: boolean) {
    this.done = (done !== undefined) ? done : false;
  };
  get slideButtonDone() {
    return this.done;
  }

  @ViewChild('slideButton', { read: ElementRef })
  private buttonElement: ElementRef;
  @ViewChild('slideButtonContainer')
  private containerElement: ElementRef;

  private isPressed: boolean = false;
  private clickPosition: any;
  private xMax: number;
  private delta: number = 8;
  private htmlButtonElem;
  private htmlContainerElem;
  private isConfirm: boolean = false;
  private containerWidth: number;
  private origin;
  private callbackDone: boolean = false;
  private done: boolean = false;
  private isDisabled: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public renderer: Renderer) {
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.htmlButtonElem = this.buttonElement.nativeElement;
      this.htmlContainerElem = this.containerElement.nativeElement;
      let buttonConstraints = this.htmlButtonElem.getBoundingClientRect();
      let containerConstraints = this.htmlContainerElem.getBoundingClientRect();
      this.origin = {
        left: buttonConstraints.left,
        top: buttonConstraints.top,
        width: buttonConstraints.width
      };
      this.containerWidth = this.htmlContainerElem.clientWidth;
      const subtract = this.containerWidth < 800 ? 75 : 200;
      this.xMax = this.containerWidth - subtract;
    }, 0);
  }

  activateButton(event: TouchEvent) {
    this.isPressed = true;
    if (typeof event.touches != "undefined") {
      this.clickPosition = event.touches[0].pageX;
    }
  }

  dragButton(event: TouchEvent) {
    if (typeof event.touches != "undefined") {
      let xTranslate = event.touches[0].pageX;
      let xDisplacement = (this.isPressed) ? xTranslate - this.clickPosition : 0;
      // Adjust displacement to consider the delta value
      xDisplacement -= this.delta;
      // Use resource inexpensive translation to perform the sliding
      let posCss = {
        "transform": "translateX(" + xDisplacement + "px)",
        "-webkit-transform": "translateX(" + xDisplacement + "px)"
      };
      // Move the element while the drag position is less than xMax
      // -delta/2 is a necessary adjustment
      if (xDisplacement >= 0
        && xDisplacement < this.containerWidth - this.origin.width * 15 / 100 + 30
        && this.isPressed) {
        // Set element styles
        this.renderer.setElementStyle(this.htmlButtonElem,
          'transform', posCss['transform']);
        this.renderer.setElementStyle(this.htmlButtonElem,
          '-webkit-transform', posCss['-webkit-transform']);
      }

      // If the max displacement position is reached 
      this.slideButtonDone = xDisplacement >= this.xMax - this.delta / 2 ? true : false;
    }
  }

  resetButton() {
    // Only reset if button sliding is not done yet
    if (!this.slideButtonDone || this.isDisabled) {
      this.isConfirm = false;
      // Reset state variables
      //this.isPressed = false;
      // Resets button position
      let posCss = {
        "transform": "translateX(0px)",
        "-webkit-transform": "translateX(0px)"
      };
      this.renderer.setElementStyle(
        this.htmlButtonElem,
        'transform',
        posCss['transform']);
      this.renderer.setElementStyle(
        this.htmlButtonElem,
        '-webkit-transform',
        posCss['-webkit-transform']);
      this.ngAfterViewInit();
    } else if (this.slideButtonDone && !this.isDisabled) {
      this.isConfirm = true;
      this.slideButtonDone = false;
      this.slideDone.emit(true);
    }
  }

  isConfirmed(boolean) {
    if (!boolean) {
      this.resetButton();
    }
  }

}
