import { Component, ViewChild } from '@angular/core';
import { NavController, Slides } from 'ionic-angular';

// pages
import { BackupKeyPage } from '../backup/backup-key/backup-key';

@Component({
  selector: 'page-create-vault-tour',
  templateUrl: 'create-vault-tour.html'
})
export class CreateVaultTourPage {
  @ViewChild('createVaultTourSlides')
  createVaultTourSlides: Slides;

  constructor(private navCtrl: NavController) {}

  public nextSlide(): void {
    this.createVaultTourSlides.slideNext();
  }

  public goToBackupPage(): void {
    this.navCtrl.push(BackupKeyPage);
  }
}
