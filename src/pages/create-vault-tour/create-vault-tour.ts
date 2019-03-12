import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, Slides } from 'ionic-angular';

// providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';

// pages
import { BackupKeyPage } from '../backup/backup-key/backup-key';

@Component({
  selector: 'page-create-vault-tour',
  templateUrl: 'create-vault-tour.html'
})
export class CreateVaultTourPage {
  @ViewChild(Slides)
  slides: Slides;
  public coin: string;
  public createVaultForm: FormGroup;
  public infoSheetType: string;

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private actionSheetProvider: ActionSheetProvider,
  ) {
    this.createVaultForm = this.fb.group({
      vaultName: [null, Validators.required]
    });
  }

  ionViewDidLoad() {
    const infoSheetIndex = 1;
    this.setInfoSheetType(infoSheetIndex);
    this.showOnboardingInfoSheet(this.infoSheetType, infoSheetIndex);
  }

  private async showOnboardingInfoSheet(
    infoSheetType,
    infoSheetIndex
  ): Promise<any> {
    const infoSheet = this.actionSheetProvider.createInfoSheet(infoSheetType);
    await infoSheet.present();
    infoSheet.onDidDismiss(() => {
      infoSheetIndex = infoSheetIndex + 1;
      if (infoSheetIndex == 2 || infoSheetIndex == 3) this.slides.slideNext();
      this.setInfoSheetType(infoSheetIndex);
      if (infoSheetIndex == 4) {
        this.goToBackupPage();
      } else {
        this.showOnboardingInfoSheet(this.infoSheetType, infoSheetIndex);
      }
    });
  }

  private setInfoSheetType(infoSheetIndex) {
    this.infoSheetType = `create-vault-onboarding-${infoSheetIndex}`;
  }

  public goToBackupPage(): void {
    this.navCtrl.push(BackupKeyPage);
  }
}
