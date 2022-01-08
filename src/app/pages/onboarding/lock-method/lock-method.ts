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
import { PinModalPage } from '../../../pages/pin/pin-modal/pin-modal';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { ThemeProvider } from 'src/app/providers';
@Component({
  selector: 'page-lock-method',
  templateUrl: 'lock-method.html',
  styleUrls: ['lock-method.scss'],

})
export class LockMethodPage {
  public biometricMethod: string;
  public pinMethodSelected: boolean = false;
  private navParamsData;
  public acceptedTerm: boolean = false;
  public toogleChecked: boolean = false;
  public currentTheme: string;

  private pageMap = {
    SelectCurrencyPage: '/select-currency',
    ImportWalletPage: '/import-wallet'
  };

  constructor(
    private logger: Logger,
    private modalCtrl: ModalController,
    private touchIdProvider: TouchIdProvider,
    private actionSheetProvider: ActionSheetProvider,
    private configProvider: ConfigProvider,
    private location: Location,
    private router: Router,
    private themeProvider: ThemeProvider
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData = history ? history.state : {};
    }
    this.currentTheme = this.themeProvider.currentAppTheme;
  }

  ngOnInit() {
    this.logger.info('Loaded: LockMethodPage');
  }

  ionViewWillEnter() {
    this.checkLockOptions();
  }

  public verifyPasscode(event) {
    if (event.detail.checked) {
      this.toogleChecked = true;
      this.pinMethodSelected = true;
      this.openPinModal();
    } else {
      this.pinMethodSelected = false;
      this.toogleChecked = false;
    }
  }

  private checkLockOptions() {
    this.touchIdProvider.isAvailable().then((isAvailable: boolean) => {
      if (isAvailable) {
        this.biometricMethod =
          this.touchIdProvider.getIosBiometricMethod() === 'face'
            ? 'faceId'
            : 'fingerprint';
      } 
    });
  }

  public verifyBiometricLockMethod(event) {
    if (event.detail.checked) {
      this.toogleChecked = true;
      if (
        this.biometricMethod === 'fingerprint' ||
        this.biometricMethod === 'faceId'
      ) {
        this.touchIdProvider.check().then(() => {
          let lock = { method: 'fingerprint', value: null, bannedUntil: null };
          this.configProvider.set({ lock });
        });
      }
    } else {
      this.toogleChecked = false;
    }
  }

  public nextPage() {
    this.router.navigate(
      [this.pageMap[this.navParamsData.nextView.name]], {
      state: this.navParamsData.nextView.params
    });
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
        this.toogleChecked = false;
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
