import { Component } from '@angular/core';

import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {

  unitName: string = 'BTC';
  selectedAlternative: any =  { name: 'US Dollar' };
  currentFeeLevel: string = 'normal'
  feeOpts: any = { 'normal': 'Normal' };

  constructor(public navCtrl: NavController) {

  }

}
