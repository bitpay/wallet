import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

@Component({
  selector: 'custom-modal',
  templateUrl: 'custom-modal.html'
})
export class CustomModalComponent {
  modal: string;

  constructor(private viewCtrl: ViewController, private navParams: NavParams) {
    this.modal = this.navParams.get('modal');
  }

  public close(data): void {
    this.viewCtrl.dismiss(data, null, { animate: false });
  }
}
