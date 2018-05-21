import { Component } from '@angular/core';
import { Content, NavParams, ViewController } from 'ionic-angular';

@Component({
  selector: 'custom-modal',
  templateUrl: 'custom-modal.html'
})
export class CustomModalComponent {
  firstButton: string;
  secondButton: string;
  imgPath: string;
  htmlMessage: string;
  title: string;
  modalClass: string;
  text: string;

  constructor(private viewCtrl: ViewController, private navParams: NavParams) {
    this.firstButton = this.navParams.get('firstButton');
    this.secondButton = this.navParams.get('secondButton');
    this.imgPath = this.navParams.get('imgPath');
    this.htmlMessage = this.navParams.get('htmlMessage');
    this.modalClass = this.navParams.get('modalClass');
    this.title = this.navParams.get('title');
    this.text = this.navParams.get('text');
  }

  public close(data): void {
    this.viewCtrl.dismiss(data, null, { animate: false });
  }
}
