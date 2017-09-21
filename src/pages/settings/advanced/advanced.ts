import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

@Component({
  selector: 'page-advanced',
  templateUrl: 'advanced.html',
})
export class AdvancedPage {

  public spendUnconfirmed: boolean;
  public recentTransactionsEnabled: boolean;
  public showNextSteps: boolean;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AdvancedPage');
  }

  spendUnconfirmedChange() {
    console.log("this.spendUnconfirmed", this.spendUnconfirmed);
  }

  recentTransactionsChange() {
    console.log("this.recentTransactionsEnabled", this.recentTransactionsEnabled);    
  }

  nextStepsChange() {
    console.log("this.showNextSteps", this.showNextSteps);    
  }

}
