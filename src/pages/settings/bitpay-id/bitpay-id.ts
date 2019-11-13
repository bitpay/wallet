import { ChangeDetectorRef, Component } from '@angular/core';

// providers
import { ActionSheetProvider, BitPayProvider, Logger, PopupProvider } from '../../../providers';
import { NavController, NavParams } from 'ionic-angular';

@Component({
  selector: 'bitpay-id',
  templateUrl: 'bitpay-id.html'
})
export class BitPayIdPage {
  public userBasicInfo;

  constructor(
    private logger: Logger,
    private navParams: NavParams,
    private bitpayProvider: BitPayProvider,
    private navCtrl: NavController,
    private popupProvider: PopupProvider,
    private actionSheetProvider: ActionSheetProvider,
    private changeDetectorRef: ChangeDetectorRef
  ) {
  }


  ionViewDidLoad() {
    this.userBasicInfo = this.navParams.data;
    this.changeDetectorRef.detectChanges();
    this.logger.info('Loaded: BitPayID page');
  }

  disconnectBitPayID() {
    this.popupProvider
      .ionicConfirm('Disconnect BitPay ID', 'Are you sure you would like to disconnect your BitPay ID?')
      .then(res => {
        if (res) {
          this.bitpayProvider.disconnectBitPayID(() => {
            const infoSheet = this.actionSheetProvider.createInfoSheet('in-app-notification', {
              title: 'BitPay ID',
              body: 'BitPay ID successfully disconnected.'
            });
            infoSheet.present();
            this.navCtrl.popToRoot();
          }, (err) => {
            this.logger.log(err);
          });
        }
      });

  }
}

