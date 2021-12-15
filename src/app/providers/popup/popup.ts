import { Injectable } from '@angular/core';
import { AlertController, AlertOptions } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../logger/logger';
@Injectable({
  providedIn: 'root'
})
export class PopupProvider {
  constructor(
    private alertCtrl: AlertController,
    private logger: Logger,
    private translate: TranslateService
  ) { }

  public ionicAlert(title: string, subTitle?: string, okText?: string): Promise<any> {
    return new Promise(async resolve => {
      let alert = this.alertCtrl.create({
        header: title,
        message: subTitle,
        backdropDismiss: false,
        buttons: [
          {
            text: okText ? okText : this.translate.instant('Ok'),
            handler: () => {
              this.logger.info('Ok clicked');
              resolve(undefined);
            }
          }
        ],
        cssClass: 'alertTheme'
      }).then(res => {
        res.present();
      })
    });
  }

  public ionicConfirm(
    title: string,
    message: string,
    okText?: string,
    cancelText?: string
  ): Promise<any> {
    return new Promise(resolve => {
      let confirm = this.alertCtrl.create({
        header: title,
        message: message,
        backdropDismiss: false,
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
        ],
        cssClass: 'alertTheme'
      }).then(res => {
        res.present();
      })
    });
  }

  public ionicPrompt(
    title: string,
    message: string,
    opts?,
    okText?: string,
    cancelText?: string
  ): Promise<any> {
    return new Promise(resolve => {
      let defaultText = opts && opts.defaultText ? opts.defaultText : null;
      let placeholder = opts && opts.placeholder ? opts.placeholder : null;
      let inputType = opts && opts.type ? opts.type : 'text';
      let cssClass = opts && opts.useDanger ? 'alertDanger' : null;
      let enableBackdropDismiss = !!(opts && opts.enableBackdropDismiss);

      let prompt = this.alertCtrl.create({
        header: title,
        message: message,
        cssClass: cssClass,
        backdropDismiss: enableBackdropDismiss,
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
            handler: () => {
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
      }).then(res => {
        res.present();
      })
    });
  }
}
