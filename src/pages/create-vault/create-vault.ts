import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController } from 'ionic-angular';

// providers
import { BrandColorProvider } from '../../providers/brand-color/brand-color';
import { Logger } from '../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';

// pages
import { CreateVaultTourPage } from '../create-vault-tour/create-vault-tour';
import { VaultColorPage } from '../vault-color/vault-color';

@Component({
  selector: 'page-create-vault',
  templateUrl: 'create-vault.html'
})
export class CreateVaultPage {
  public coin: string;
  public createVaultForm: FormGroup;
  public colorIndex: number;

  constructor(
    private fb: FormBuilder,
    private logger: Logger,
    private navCtrl: NavController,
    private profileProvider: ProfileProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private translate: TranslateService,
    private popupProvider: PopupProvider,
    private modalCtrl: ModalController,
    public brandColorProvider: BrandColorProvider
  ) {
    this.createVaultForm = this.fb.group({
      vaultName: [null, Validators.required],
      color: ['#484ed3', Validators.required]
    });
    this.colorIndex = 8;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CreateVaultPage');
  }

  public openColorPageModal(): void {
    const modal = this.modalCtrl.create(
      VaultColorPage,
      { vaultColor: this.createVaultForm.value.color },
      { showBackdrop: true, enableBackdropDismiss: false }
    );
    modal.present();
    modal.onDidDismiss(vaultColor => {
      this.createVaultForm.controls['color'].setValue(vaultColor);
      this.colorIndex = this.colorToIndex(vaultColor);
    });
  }

  private colorToIndex(color: string) {
    const COLOR_COUNT = 14;
    const colorCount = Array(COLOR_COUNT)
      .fill(0)
      .map((_, i) => i);
    for (let i = 0; i < colorCount.length; i++) {
      if (this.indexToColor(i) == color.toLowerCase()) {
        return i;
      }
    }
    return undefined;
  }

  private indexToColor(i: number): string {
    // Expect an exception to be thrown if can't getComputedStyle().
    return this.rgb2hex(
      (window as any).getComputedStyle(
        document.getElementsByClassName('vault-color-' + i)[0]
      ).backgroundColor
    );
  }

  private rgb2hex(rgb): string {
    rgb = rgb.match(
      /^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i
    );
    return rgb && rgb.length === 4
      ? '#' +
          ('0' + parseInt(rgb[1], 10).toString(16)).slice(-2) +
          ('0' + parseInt(rgb[2], 10).toString(16)).slice(-2) +
          ('0' + parseInt(rgb[3], 10).toString(16)).slice(-2)
      : '';
  }

  public goToCreateVaultTour(mnemonics): void {
    this.navCtrl.push(CreateVaultTourPage, { mnemonics });
  }

  public async createVault() {
    this.onGoingProcessProvider.set('creatingVault');

    const vaultName = this.createVaultForm.value.vaultName;
    const vaultColor = this.createVaultForm.value.color;

    const vault = {
      vaultName,
      vaultColor,
      walletIds: [],
      needsBackup: true
    };

    this.profileProvider
      .createVault(vault)
      .then(vaultClient => {
        const mnemonics = vaultClient.mnemonics;
        this.onGoingProcessProvider.clear();
        this.goToCreateVaultTour(mnemonics);
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        const title = this.translate.instant('Cannot create vault');
        const okText = this.translate.instant('Retry');
        this.popupProvider.ionicAlert(title, err, okText).then(() => {
          this.createVault();
        });
      });
  }
}
