import { Component } from '@angular/core';

import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {

  unitName: string = 'BTC';

  constructor(public navCtrl: NavController) {

  }

}
