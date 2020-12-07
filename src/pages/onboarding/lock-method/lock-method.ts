import { Component } from '@angular/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';

// Providers
import {
  ActionSheetProvider,
  InfoSheetType
} from '../../../providers/action-sheet/action-sheet';
import { ConfigProvider } from '../../../providers/config/config';
import { Logger } from '../../../providers/logger/logger';
import { TouchIdProvider } from '../../../providers/touchid/touchid';

// Pages
import { ImportWalletPage } from '../../../pages/add/import-wallet/import-wallet';
import { SelectCurrencyPage } from '../../../pages/add/select-currency/select-currency';
import { PinModalPage } from '../../../pages/pin/pin-modal/pin-modal';

@Component({
  selector: 'page-lock-method',
  templateUrl: 'lock-method.html'
})
export class LockMethodPage {
  public biometricMethod: string;
  public pinMethodSelected: boolean = false;
  private nextView;

  private pageMap = {
    SelectCurrencyPage,
    ImportWalletPage
  };

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger,
    private modalCtrl: ModalController,
    private touchIdProvider: TouchIdProvider,
    private actionSheetProvider: ActionSheetProvider,
    private configProvider: ConfigProvider
  ) {
    this.nextView = this.navParams.data.nextView;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: LockMethodPage');
  }

  ionViewWillEnter() {
    this.checkLockOptions();
  }

  private checkLockOptions() {
    this.touchIdProvider.isAvailable().then((isAvailable: boolean) => {
      if (isAvailable) {
        this.biometricMethod =
          this.touchIdProvider.getIosBiometricMethod() === 'face'
            ? 'faceId'
            : 'fingerprint';
      } else {
        this.pinMethodSelected = true;
        this.openPinModal();
      }
    });
  }

  public verifyBiometricLockMethod() {
    if (
      this.biometricMethod === 'fingerprint' ||
      this.biometricMethod === 'faceId'
    ) {
      this.touchIdProvider.check().then(() => {
        let lock = { method: 'fingerprint', value: null, bannedUntil: null };
        this.configProvider.set({ lock });
        this.navCtrl.push(
          this.pageMap[this.nextView.name],
          this.nextView.params
        );
      });
    }
  }

  private openPinModal(): void {
    const modal = this.modalCtrl.create(
      PinModalPage,
      {
        action: 'pinSetUp'
      },
      { cssClass: 'fullscreen-modal' }
    );
    modal.present();
    modal.onDidDismiss(cancelClicked => {
      if (cancelClicked) {
        this.pinMethodSelected = false;
        if (!this.biometricMethod) this.navCtrl.pop();
      } else
        this.navCtrl.push(
          this.pageMap[this.nextView.name],
          this.nextView.params
        );
    });
  }

  public showInfoSheet(infoSheetType: InfoSheetType): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(infoSheetType);
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
        this.pinMethodSelected = true;
        this.openPinModal();
      }
    });
  }
}
