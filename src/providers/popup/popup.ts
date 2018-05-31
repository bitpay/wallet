import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AlertController, Modal, ModalController } from 'ionic-angular';
import { MiniModalComponent } from '../../components/mini-modal/mini-modal';
import { Logger } from '../../providers/logger/logger';

export type MiniModalTitle =
  | 'backup-needed'
  | 'backup-ready'
  | 'backup-warning'
  | 'fee-warning'
  | 'sensitive-info';

@Injectable()
export class PopupProvider {
  constructor(
    private alertCtrl: AlertController,
    private logger: Logger,
    private modalCtrl: ModalController,
    private translate: TranslateService
  ) {}

  public ionicAlert(
    title: string,
    subTitle?: string,
    okText?: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let alert = this.alertCtrl.create({
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
      let confirm = this.alertCtrl.create({
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
        ],
        enableBackdropDismiss: false
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
      let defaultText = opts && opts.defaultText ? opts.defaultText : null;
      let placeholder = opts && opts.placeholder ? opts.placeholder : null;
      let inputType = opts && opts.type ? opts.type : 'text';
      let cssClass = opts && opts.useDanger ? 'alertDanger' : null;
      let enableBackdropDismiss = !!(opts && opts.enableBackdropDismiss);

      let prompt = this.alertCtrl.create({
        title,
        message,
        cssClass,
        enableBackdropDismiss,
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

  public createMiniModal(modalTitle: MiniModalTitle): Modal {
    return this.modalCtrl.create(
      MiniModalComponent,
      { modal: modalTitle },
      { cssClass: 'fullscreen-modal' }
    );
  }
}
