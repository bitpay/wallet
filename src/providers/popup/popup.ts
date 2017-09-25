import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { AlertController } from 'ionic-angular';

@Injectable()
export class PopupProvider {
  constructor(private platform: Platform, public alertCtrl: AlertController) {
  }

  ionicAlert(title, subTitle, okText): void {
    let alert = this.alertCtrl.create({
      title: title,
      subTitle: subTitle,
      buttons: [okText]
    });
    alert.present();
  };

  ionicConfirm(title, message, okText, cancelText): void {
    let confirm = this.alertCtrl.create({
      title: title,
      message: message,
      buttons: [
        {
          text: cancelText,
          handler: () => {
            console.log('Disagree clicked');
          }
        },
        {
          text: okText,
          handler: () => {
            console.log('Agree clicked');
          }
        }
      ]
    });
    confirm.present();
  };

  ionicPrompt(title, message, okText, cancelText, opts) {
    opts = opts || {};
    let prompt = this.alertCtrl.create({
      title: title,
      message: message,
      inputs: [
        {
          name: 'title',
          placeholder: 'Title'
        },
      ],
      buttons: [
        {
          text: cancelText,
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: okText,
          handler: data => {
            console.log('Saved clicked');
          }
        }
      ]
    });
    prompt.present();
  }
}
