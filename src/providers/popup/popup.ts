import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AlertController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class PopupProvider {
  constructor(
    private alertCtrl: AlertController,
    private logger: Logger,
    private translate: TranslateService
  ) {}

  public ionicAlert(
    title: string,
    subTitle?: string,
    okText?: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const alert = this.alertCtrl.create({
        title,
        subTitle,
        enableBackdropDismiss: false,
        buttons: [
          {
            text: okText ? okText : this.translate.instant('Ok'),
            handler: () => {
              this.logger.info('Ok clicked');
              resolve();
            }
          }
        ]
      });
      alert.present();
    });
  }

  public ionicConfirm(
    title: string,
    message: string,
    okText?: string,
    cancelText?: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const confirm = this.alertCtrl.create({
        title,
        message,
        buttons: [
          {
            text: cancelText ? cancelText : this.translate.instant('Cancel'),
            handler: () => {
              this.logger.info('Disagree clicked');
              resolve(false);
            }
          },
          {
            text: okText ? okText : this.translate.instant('Ok'),
            handler: () => {
              this.logger.info('Agree clicked');
              resolve(true);
            }
          }
        ]
      });
      confirm.present();
    });
  }

  public ionicPrompt(
    title: string,
    message: string,
    opts?: any,
    okText?: string,
    cancelText?: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const defaultText = opts && opts.defaultText ? opts.defaultText : null;
      const placeholder = opts && opts.placeholder ? opts.placeholder : null;
      const inputType = opts && opts.type ? opts.type : 'text';

      const prompt = this.alertCtrl.create({
        title,
        message,
        inputs: [
          {
            value: defaultText,
            placeholder,
            type: inputType
          }
        ],
        buttons: [
          {
            text: cancelText ? cancelText : this.translate.instant('Cancel'),
            handler: data => {
              this.logger.info('Cancel clicked');
              resolve(null);
            }
          },
          {
            text: okText ? okText : this.translate.instant('Ok'),
            handler: data => {
              this.logger.info('Saved clicked');
              resolve(data[0]);
            }
          }
        ]
      });
      prompt.present();
    });
  }
}
