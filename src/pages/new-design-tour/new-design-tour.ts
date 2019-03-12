import { Component, ViewChild } from '@angular/core';
import { NavController, Slides } from 'ionic-angular';

// pages
import { BackupKeyPage } from '../backup/backup-key/backup-key';

@Component({
  selector: 'page-new-design-tour',
  templateUrl: 'new-design-tour.html'
})
export class NewDesignTourPage {

  @ViewChild('newDesignTourSlides')
  newDesignTourSlides: Slides;

  constructor(
    private navCtrl: NavController,
  ) {
  }

  public nextSlide(): void {
    this.newDesignTourSlides.slideNext();
  }

  public goToBackupPage(): void {
    this.navCtrl.push(BackupKeyPage);
  }

}
