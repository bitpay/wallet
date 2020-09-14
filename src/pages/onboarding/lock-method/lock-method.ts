import { Component } from '@angular/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';

// Providers
import {
  ActionSheetProvider,
  InfoSheetType
} from '../../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../../providers/app/app';
import { ConfigProvider } from '../../../providers/config/config';
import { Logger } from '../../../providers/logger/logger';
import { TouchIdProvider } from '../../../providers/touchid/touchid';

// Pages
import { ImportWalletPage } from '../../../pages/add/import-wallet/import-wallet';
import { SelectCurrencyPage } from '../../../pages/add/select-currency/select-currency';
import { FinishModalPage } from '../../../pages/finish/finish';
import { PinModalPage } from '../../../pages/pin/pin-modal/pin-modal';

@Component({
  selector: 'page-lock-method',
  templateUrl: 'lock-method.html'
})
export class LockMethodPage {
  public appName: string;
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
    private configProvider: ConfigProvider,
    private appProvider: AppProvider
  ) {
    this.nextView = this.navParams.data.nextView;
    this.appName = this.appProvider.info.nameCase;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: LockMethodPage');
  }

  async ionViewWillLoad() {
    // TODO: check Face Id -> this.biometricMethod = 'faceId';
    await this.checkLockOptions();
    this.showInfoSheet('protect-money');
  }

  private checkLockOptions() {
    this.touchIdProvider.isAvailable().then((isAvailable: boolean) => {
      if (isAvailable) {
        this.biometricMethod = 'fingerprint';
      }
    });
  }

  public verifyBiometricLockMethod() {
    if (this.biometricMethod === 'fingerprint') {
      this.touchIdProvider.check().then(() => {
        let lock = { method: 'fingerprint', value: null, bannedUntil: null };
        this.configProvider.set({ lock });
        this.openFinishModal('Fingerprint');
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
      !cancelClicked
        ? this.openFinishModal('PIN')
        : (this.pinMethodSelected = false);
    });
  }

  private openFinishModal(finishText: string) {
    const params = {
      finishText: `${finishText} set successfully!`,
      autoDismiss: true,
      cssClass: 'bg-none'
    };
    let modal = this.modalCtrl.create(FinishModalPage, params, {
      showBackdrop: true,
      enableBackdropDismiss: false
    });
    modal.present();
    modal.onDidDismiss(() => {
      this.navCtrl.push(this.pageMap[this.nextView.name], this.nextView.params);
    });
  }

  private showInfoSheet(infoSheetType: InfoSheetType): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(infoSheetType);
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (
        (option && infoSheetType === 'pincode-info') ||
        (option && infoSheetType === 'protect-money' && !this.biometricMethod)
      ) {
        this.pinMethodSelected = true;
        this.openPinModal();
      }
    });
  }
}
