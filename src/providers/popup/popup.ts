import { Injectable } from '@angular/core';
import { AlertController } from 'ionic-angular';

@Injectable()
export class PopupProvider {
  constructor(public alertCtrl: AlertController) {
  }

  public ionicAlert(title: string, subTitle?: string, okText?: string): void {
    let alert = this.alertCtrl.create({
      title: title,
      subTitle: subTitle,
      buttons: [okText]
    });
    alert.present();
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
              reject();
            }
          },
          {
            text: okText,
            handler: () => {
              console.log('Agree clicked');
              resolve();
            }
          }
        ]
      });
      confirm.present();
    });
  };

  public ionicPrompt(title: string, message: string, okText?: string, cancelText?: string): Promise<any> {
    return new Promise((resolve, reject) => {
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
              reject(data);
            }
          },
          {
            text: okText,
            handler: data => {
              console.log('Saved clicked');
              resolve(data);
            }
          }
        ]
      });
      prompt.present();
    });
  }
}
