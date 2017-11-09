import { Injectable } from '@angular/core';
import { LoadingController } from 'ionic-angular';

@Injectable()
export class OnGoingProcessProvider {
  private loading: any;
  constructor(
    private loadingCtrl: LoadingController,
  ) {
    console.log('Hello OnGoingProcessProvider Provider');
  }

  public set(processName: string, isOn: boolean, customHandler?: any) {
    console.log('TODO: OnGoingProcessProvider set()...');
    if (isOn) {
      this.loading = this.loadingCtrl.create({
        content: processName
      });
      this.loading.present();

    }
    else {
      this.loading.dismiss();
    }
  }

}