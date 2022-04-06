import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoadingProvider {
  defaultDuration: any = 1000;
  defaultMessage: any = 'Loading...';
  constructor(
    private loadingCtr: LoadingController
  ) { }

  public simpleLoader(message?) {
    this.loadingCtr
    .create({
        message: message ? message : this.defaultMessage,
    }).then((response) => {
        response.present();
    });
  }

  public dismissLoader() {
    this.loadingCtr.dismiss();
  }

  // Auto hide show loader
  public autoLoader(message? , duration?) {
    this.loadingCtr.create({
      message: message ? message : this.defaultMessage,
      duration: duration ? duration : this.defaultDuration,
      backdropDismiss: true
    }).then((response) => {
      response.present();
      response.onDidDismiss().then((response) => {
        console.log('Loader dismissed', response);
      });
    });
  } 

}
