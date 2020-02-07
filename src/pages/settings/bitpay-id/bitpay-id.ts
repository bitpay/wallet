import { ChangeDetectorRef, Component } from '@angular/core';

// providers
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';
import {
  ActionSheetProvider,
  BitPayIdProvider,
  Logger,
  PopupProvider
} from '../../../providers';
import { InAppBrowserProvider } from '../../../providers/in-app-browser/in-app-browser';

@Component({
  selector: 'bitpay-id',
  templateUrl: 'bitpay-id.html'
})
export class BitPayIdPage {
  public userBasicInfo;

  constructor(
    private logger: Logger,
    private navParams: NavParams,
    private bitPayIdProvider: BitPayIdProvider,
    private navCtrl: NavController,
    private popupProvider: PopupProvider,
    private actionSheetProvider: ActionSheetProvider,
    private changeDetectorRef: ChangeDetectorRef,
    private translate: TranslateService,
    private iab: InAppBrowserProvider
  ) {}

  ionViewDidLoad() {
    this.userBasicInfo = this.navParams.data;
    this.changeDetectorRef.detectChanges();
    this.logger.info('Loaded: BitPayID page');
  }

  disconnectBitPayID() {
    this.popupProvider
      .ionicConfirm(
        this.translate.instant('Disconnect BitPay ID'),
        this.translate.instant(
          'Are you sure you would like to disconnect your BitPay ID?'
        )
      )
      .then(res => {
        if (res) {
          this.bitPayIdProvider.disconnectBitPayID(
            () => {
              const infoSheet = this.actionSheetProvider.createInfoSheet(
                'in-app-notification',
                {
                  title: 'BitPay ID',
                  body: this.translate.instant(
                    'BitPay ID successfully disconnected.'
                  )
                }
              );
              this.iab.refs.card.executeScript({
                code: `window.postMessage(${JSON.stringify({
                  message: 'bitPayIdDisconnected'
                })}, '*')`
              }, () => {
                infoSheet.present();
                this.navCtrl.popToRoot();
              });

            },
            err => {
              this.logger.log(err);
            }
          );
        }
      });
  }
}
