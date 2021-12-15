import { Component } from '@angular/core';

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
import { ModalController, NavController, NavParams } from '@ionic/angular';
import { Router } from '@angular/router';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Location } from '@angular/common';
@Component({
  selector: 'page-lock-method',
  templateUrl: 'lock-method.html',
  styleUrls: ['lock-method.scss'],

})
export class LockMethodPage {
  public biometricMethod: string;
  public pinMethodSelected: boolean = false;
  private navParamsData;

  private pageMap = {
    SelectCurrencyPage: '/select-currency',
    ImportWalletPage: '/import-wallet'
  };

  constructor(
    private navCtrl: NavController,
    // private navParams: NavParams,
    private logger: Logger,
    private modalCtrl: ModalController,
    private touchIdProvider: TouchIdProvider,
    private actionSheetProvider: ActionSheetProvider,
    private configProvider: ConfigProvider,
    private location: Location,
    private router: Router,
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData = history ? history.state : {};
    }
  }

  ngOnInit() {
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
        this.router.navigate(
          this.pageMap[this.navParamsData.nextView.name], {
          state: { ...this.navParamsData.nextView.name }
        }
        );
      });
    }
  }

  async openPinModal() {
    const modal = await this.modalCtrl.create({
      component: PinModalPage,
      cssClass: 'fullscreen-modal',
      componentProps: { action: 'pinSetUp' }
    }
    );
    modal.onDidDismiss().then((cancelClicked) => {
      if (cancelClicked.data) {
        this.pinMethodSelected = false;
        if (!this.biometricMethod) this.location.back();
      }
      else {
        this.router.navigate([this.pageMap[this.navParamsData.nextView.name]], {
          state: {
            ...this.navParamsData.nextView.params
          }
        });
      }
    });

    return await modal.present();
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
