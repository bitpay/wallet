import {
  animate,
  keyframes,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavParams, ViewController } from 'ionic-angular';

@Component({
  selector: 'page-finish',
  templateUrl: 'finish.html',
  animations: [
    trigger('photoState', [
      state(
        'launch',
        style({
          overflow: 'hidden',
          position: 'fixed',
          'text-align': 'center',
          top: '85%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        })
      ),
      state(
        'land',
        style({
          overflow: 'hidden',
          position: 'fixed',
          'text-align': 'center',
          top: '85%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        })
      ),

      transition(
        '* => launch',
        animate(
          '4000ms ease-out',
          keyframes([
            style({ transform: 'translate(-50%,-50%)', offset: 0 }),
            style({ transform: 'translate(-50%, -49%)', offset: 0.2 }),
            style({ transform: 'translate(-50%, -50%)', offset: 0.24 }),
            style({ transform: 'translate(-50%, -49%)', offset: 0.26 }),
            style({ transform: 'translate(-50%, -50%)', offset: 0.28 }),
            style({ transform: 'translate(-50%, -49%)', offset: 0.3 }),
            style({ transform: 'translate(-50%, -50%)', offset: 0.32 }),
            style({ transform: 'translate(-50%, -51%)', offset: 0.34 }),
            style({ transform: 'translate(-50%, -50%)', offset: 0.36 }),
            style({ transform: 'translate(-50%,-300%)', offset: 1.0 })
          ])
        )
      ),
      transition(
        '* => land',
        animate(
          '5000ms ease-out',
          keyframes([
            style({ transform: 'translate(-50%, -250%)', offset: 0 }),
            style({ transform: 'translate(-50%, -49%)', offset: 0.7 }),
            style({ transform: 'translate(-49%, -50%)', offset: 0.74 }),
            style({ transform: 'translate(-50%, -49%)', offset: 0.76 }),
            style({ transform: 'translate(-50%, -50%)', offset: 0.78 }),
            style({ transform: 'translate(-49%, -49%)', offset: 0.8 }),
            style({ transform: 'translate(-50%, -50%)', offset: 0.82 }),
            style({ transform: 'translate(-49%, -50%)', offset: 0.84 }),
            style({ transform: 'translate(-50%, -50%)', offset: 0.86 }),
            style({ transform: 'translate(-49%, -50%)', offset: 0.88 }),
            style({ transform: 'translate(-50%, -50%)', offset: 0.9 }),
            style({ transform: 'translate(-51%, -50%)', offset: 0.92 }),
            style({ transform: 'translate(-50%, -50%)', offset: 0.94 }),
            style({ transform: 'translate(-51%, -50%)', offset: 0.96 }),
            style({ transform: 'translate(-50%, -50%)', offset: 0.98 }),
            style({ transform: 'translate(-50%, -50%)', offset: 1 })
          ])
        )
      )
    ])
  ]
})
export class FinishModalPage {
  public finishText: string;
  public finishComment: string;
  public cssClass: string; // success, warning, danger, primary
  public showLaunchRocket = false;
  public showLandRocket = false;
  public launchRocketPosition: string;
  public landRocketPosition: string;

  constructor(
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private translate: TranslateService
  ) {
    this.finishText =
      this.navParams.data.finishText || this.navParams.data.finishText == ''
        ? this.navParams.data.finishText
        : this.translate.instant('Payment Sent');
    this.finishComment = this.navParams.data.finishComment
      ? this.navParams.data.finishComment
      : '';
    this.cssClass = this.navParams.data.cssClass
      ? this.navParams.data.cssClass
      : 'success';

    if (this.navParams.get('autoDismiss')) {
      setTimeout(() => {
        this.viewCtrl.dismiss();
      }, 4000);
    }
    if (
      this.navParams.data.coin &&
      this.navParams.data.coin === 'doge' &&
      this.cssClass === 'success'
    ) {
      this.showLaunchRocket = true;
      setTimeout(() => {
        this.launchRocketPosition = 'launch';
      }, 2000);
    }
  }

  public close(): void {
    this.viewCtrl.dismiss();
  }

  public rocketLanding(newPosition: string): void {
    if (this.launchRocketPosition) {
      this.showLaunchRocket = false;
      this.showLandRocket = true;
      this.landRocketPosition = newPosition;
    }
  }
}
