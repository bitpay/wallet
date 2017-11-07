import { Injectable } from '@angular/core';
import { AlertController } from 'ionic-angular';

@Injectable()
export class PopupProvider {
  constructor(public alertCtrl: AlertController) {
  }

  public ionicAlert(title: string, subTitle?: string, okText?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let alert = this.alertCtrl.create({
        title: title,
        subTitle: subTitle,
        buttons: [
          {
            text: okText,
            handler: () => {
              console.log('Ok clicked');
              resolve();
            }
          }
        ]
      });
      alert.present();
    });
  };

  public ionicConfirm(title, message, okText, cancelText): Promise<any> {
    return new Promise((resolve, reject) => {
      let confirm = this.alertCtrl.create({
        title: title,
        message: message,
        buttons: [
          {
            text: cancelText,
            handler: () => {
              console.log('Disagree clicked');
              resolve(false);
            }
          },
          {
            text: okText,
            handler: () => {
              console.log('Agree clicked');
              resolve(true);
            }
          }
        ]
      });
      confirm.present();
    });
  };

  public ionicPrompt(title: string, message: string, opts: any, okText?: string, cancelText?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let prompt = this.alertCtrl.create({
        title: title,
        message: message,
        inputs: [
          {
            value: opts.defaultText,
            placeholder: opts.placeholder
          },
        ],
        buttons: [
          {
            text: cancelText ? cancelText : 'Cancel',
            handler: data => {
              console.log('Cancel clicked');
              resolve(null);
            }
          },
          {
            text: okText ? okText : 'OK',
            handler: data => {
              console.log('Saved clicked');
              resolve(data[0]);
            }
          }
        ]
      });
      prompt.present();
    });
  }
}
