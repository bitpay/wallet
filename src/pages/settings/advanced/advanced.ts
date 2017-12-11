import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

//providers
import { ConfigProvider } from '../../../providers/config/config';

@Component({
  selector: 'page-advanced',
  templateUrl: 'advanced.html',
})
export class AdvancedPage {

  public spendUnconfirmed: boolean;
  public recentTransactionsEnabled: boolean;
  public showNextSteps: boolean;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public configProvider: ConfigProvider
  ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AdvancedPage');
  }

  ionViewWillEnter() {
    let config = this.configProvider.get();

    this.spendUnconfirmed = config.wallet.spendUnconfirmed;
    this.recentTransactionsEnabled = config.recentTransactions.enabled;
    this.showNextSteps = config.showNextSteps.enabled;
  }

  public spendUnconfirmedChange(): void {
    let opts = {
      wallet: {
        spendUnconfirmed: this.spendUnconfirmed
      }
    };
    this.configProvider.set(opts);
  }

  public recentTransactionsChange(): void {
    let opts = {
      recentTransactions: {
        enabled: this.recentTransactionsEnabled
      }
    };
    this.configProvider.set(opts);
  }

  public nextStepsChange(): void {
    let opts = {
      showNextSteps: {
        enabled: this.showNextSteps
      },
    };
    this.configProvider.set(opts);
  }

}
