import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

@Component({
  selector: 'page-incoming-data-menu',
  templateUrl: 'incoming-data-menu.html',
})
export class IncomingDataMenuPage {

  public data: string;
  public type: string;
  public https: boolean;

  constructor(
    private viewCtrl: ViewController,
    private navParams: NavParams,
  ) {
    this.https = false;
  }

  ionViewDidLoad() {
    this.data = this.navParams.data.data;
    this.type = this.navParams.data.type;
    if (this.type === 'url') {
      if (this.data.indexOf('https://') === 0) {
        this.https = true;
      }
    }
  }

  public close(redirTo: string, value: string) {
    this.viewCtrl.dismiss({ redirTo: redirTo, value: value });
  }
}