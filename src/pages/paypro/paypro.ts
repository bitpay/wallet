import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

@Component({
  selector: 'page-payrpo',
  templateUrl: 'paypro.html',
})
export class PayProPage {


  constructor(public viewCtrl: ViewController) {

  }

  close() {
    this.viewCtrl.dismiss();
  }
}