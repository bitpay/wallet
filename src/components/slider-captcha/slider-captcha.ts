import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

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

  modalTitle: string;
  modelId: number;

  constructor(
    // private modalController: ModalController,
    private navParams: NavParams
  ) { }

  ngOnInit() {
    console.table(this.navParams);
    this.modelId = this.navParams.data.paramID;
    this.modalTitle = this.navParams.data.paramTitle;
  }

  // async closeModal() {
  //   const onClosedData: string = "Wrapped Up!";
  //   //await this.modalController.dismiss(onClosedData);
  // }

}
