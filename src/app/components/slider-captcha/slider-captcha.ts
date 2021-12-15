import { Component, ViewEncapsulation } from '@angular/core';
import { ModalController } from '@ionic/angular';
import SlideVerify from 'slide-verify';

/**
 * Generated class for the SliderCaptchaComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'slider-captcha',
  templateUrl: 'slider-captcha.html',
  styleUrls: ['slider-captcha.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SliderCaptchaComponent {

  constructor(
    private viewContrl: ModalController
    
  ) { }

  ngOnInit() {
    let photosList = ['assets/img/slide-captcha/moon_and_earth.jpg']

    new SlideVerify({
      elementId: "slider",
      lang: 'en',
      onSuccess: () => {
        console.log('success');
        this.viewContrl.dismiss('success');
      },
      onFail: () => { console.log("fail") },
      onRefresh: () => { console.log('refresh')},
      photo: photosList
    });
  }

  closeModal() {
    this.viewContrl.dismiss();
  }
}
