import { Component, Input, ViewChild, ElementRef, Renderer, AfterViewInit } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the SlideToAcceptPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-slide-to-accept',
  templateUrl: 'slide-to-accept.html',
})
export class SlideToAcceptPage implements AfterViewInit {

  @Input() slideButtonText: string;
  @Input() slideButtonInstructions: string;
  @Input() slideButtonHelperText: string;

  isPressed: boolean = false;
  private clickPosition: any; //{ x: number, y: number };

  @ViewChild('slideButton', { read: ElementRef })
  private buttonElement: ElementRef;
  @ViewChild('slideButtonContainer')
  private containerElement: ElementRef;
  private xMax: number;
  private delta: number = 8;
  htmlButtonElem;
  htmlContainerElem;

  @Input() operationContext: any; // Contains parent variables
  @Input() actionCallback: Function;
  private callbackDone: boolean = false;
  private done: boolean = false;
  @Input()
  set slideButtonDone(done: boolean) {
    this.done = (done !== undefined) ? done : false;
  };
  get slideButtonDone() {
    return this.done;
  }

  constructor(public navCtrl: NavController, public navParams: NavParams, public renderer: Renderer) {
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit buttonElement');
    setTimeout(() => {
      console.log(this.buttonElement, this.containerElement);
      console.log(this.buttonElement.nativeElement,
        this.containerElement.nativeElement);
      this.htmlButtonElem = this.buttonElement.nativeElement;
      this.htmlContainerElem = this.containerElement.nativeElement;
      let buttonConstraints = this.htmlButtonElem.getBoundingClientRect();
      let containerConstraints = this.htmlContainerElem.getBoundingClientRect();
      let origin = {
        left: buttonConstraints.left,
        top: buttonConstraints.top,
        width: buttonConstraints.width
      };
      let containerWidth: number = this.htmlContainerElem.clientWidth;
      const subtract = containerWidth < 800 ? 75 : 200;
      this.xMax = containerWidth - subtract;
      console.log('delta: ', this.delta);
      console.log('Button width: ', origin.width);
      console.log('Container width: ', containerWidth);
      console.log('xMax: ', this.xMax);
    }, 300);
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
      console.log("xDisplacement", xDisplacement);
      // Use resource inexpensive translation to perform the sliding
      let posCss = {
        "transform": "translateX(" + xDisplacement + "px)",
        "-webkit-transform": "translateX(" + xDisplacement + "px)"
      };
      // Move the element while the drag position is less than xMax
      // -delta/2 is a necessary adjustment
      if (xDisplacement >= 0
        && xDisplacement < this.xMax - this.delta / 2
        && this.isPressed) {
        // Set element styles
        this.renderer.setElementStyle(this.htmlButtonElem,
          'transform', posCss['transform']);
        this.renderer.setElementStyle(this.htmlButtonElem,
          '-webkit-transform', posCss['-webkit-transform']);
      }
      // Negates previous condition (should be an else...)
      else {

        if (xDisplacement >= this.xMax - this.delta / 2) {
          // If the max displacement position is reached 
          // then execute the callback function
          console.log("################");

          if (!!this.actionCallback && !this.callbackDone) {

            console.log('Execute callback');
            this.callbackDone = true;
            this.actionCallback(this.operationContext)
              .then((data) => {
                console.log('Executed callback (promise)'
                  , data);
                // Move the button to the ending position
                // Adjust state variables
                setTimeout(() => {
                  posCss = {
                    "transform": "translateX(" + this.xMax
                      + "px)",
                    "-webkit-transform": "translateX("
                      + this.xMax + "px)"
                  };
                  this.renderer.setElementStyle(
                    this.htmlButtonElem,
                    'transform', posCss['transform']);
                  this.renderer.setElementStyle(
                    this.htmlButtonElem,
                    '-webkit-transform',
                    posCss['-webkit-transform']);
                  this.renderer.setElementStyle(
                    this.htmlButtonElem,
                    'transition',
                    '0.5s ease-in-out');
                  this.renderer.setElementStyle(
                    this.htmlButtonElem,
                    '-webkit-transition',
                    '0.5s ease-in-out');
                  this.isPressed = true;
                  this.slideButtonDone = true;
                }, 10);
              });
          }
        }
      }
    }
  }
  resetButton() {
    // Only reset if button sliding is not done yet
    if (!this.slideButtonDone) {
      // Re-enables menu
      //this.menuController.enable(true);
      // Reset state variables
      //this.isPressed = false;
      this.slideButtonDone = false;
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
    }
  }

}
