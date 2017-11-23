import { Injectable } from '@angular/core';
import { LoadingController } from 'ionic-angular';

@Injectable()
export class OnGoingProcessProvider {
  private loading: any;
  private processNames: any;

  constructor(
    private loadingCtrl: LoadingController,
  ) {
    console.log('Hello OnGoingProcessProvider Provider');
    // TODO gettextcatalog()
    this.processNames = {
      'loadingTx': 'Loading transaction...',
      'creatingWallet': 'Creating Wallet...',
      'joiningWallet': 'Joining Wallet...'
    };
  }

  public set(processName: string, isOn: boolean, customHandler?: any) {
    if (!isOn) {
      this.loading.dismiss();
      return;
    }
    this.loading = this.loadingCtrl.create({
      content: this.processNames[processName]
    });
    this.loading.present();
  }
}