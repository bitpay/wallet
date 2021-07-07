import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';
import SlideVerify from 'slide-verify';

// File
import { File } from '@ionic-native/file';

/**
 * Generated class for the SliderCaptchaComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'slider-captcha',
  templateUrl: 'slider-captcha.html'
})
export class SliderCaptchaComponent {

  constructor(
    private viewContrl: ViewController,
    private file: File
    
  ) { }

  ngOnInit() {
    this.file.checkDir(this.file.applicationDirectory, '../../assets/img/add-wallet')
        .then(_ => console.log('Directory exists'))
        .catch(err => console.log('error:', err));

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
