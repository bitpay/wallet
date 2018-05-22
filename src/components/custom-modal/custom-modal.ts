import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Content, NavParams, ViewController } from 'ionic-angular';

@Component({
  selector: 'custom-modal',
  templateUrl: 'custom-modal.html'
})
export class CustomModalComponent {
  confirmButton: any;
  backButton: any;
  imgPath: string;
  message: string;
  title: string;
  modalClass: string;

  constructor(
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private translate: TranslateService
  ) {
    this.backButton = {
      text: this.translate.instant('Go Back'),
      color: 'warning',
      data: false
    };
    this.confirmButton = {
      text: this.translate.instant('I understand'),
      color: 'warning',
      data: true
    };
    this.modalClass = 'warning';
    let modal = this.navParams.get('modal');
    this.getModalData(modal);
  }

  private getModalData(modal) {
    switch (modal) {
      case 'backup-ready':
      this.title = this.translate.instant('Your bitcoin wallet is backed up!');
        this.confirmButton = {
          text: this.translate.instant('Got it'),
          color: 'success',
          data: true
        };
        this.backButton = {};
        this.imgPath = 'assets/img/onboarding-success.svg';
        this.message = this.translate.instant(
          'Be sure to store your recovery phrase in a secure place. If this app is deleted, your money cannot be recovered without it.'
        );
        this.modalClass = 'success';
        break;
      case 'backup-warning':
      this.title = this.translate.instant('Screenshots are not secure');
        this.imgPath = 'assets/img/no-screenshot.svg';
        this.message = this.translate.instant(
          'If you take a screenshot, your backup may be viewed by other apps. You can make a safe backup with physical paper and a pen.'
        );
        break;
      case 'backup-needed':
      this.title = this.translate.instant('Backup Needed');
        this.backButton = {
          text: this.translate.instant('Do it later'),
          color: 'danger',
          data: false
        };
        this.confirmButton = {
          text: this.translate.instant('Backup now'),
          color: 'danger',
          data: true
        };
        this.imgPath = 'assets/img/warning.svg';
        this.message = this.translate.instant(
          'Now is a good time to backup your wallet. If this device is lost, it is impossible to access your funds without a backup.'
        );
        this.modalClass = 'danger';
        break;
      case 'sensitive-info':
      this.title = this.translate.instant('Sensitive Data');
        this.imgPath = 'assets/img/icon-warning.svg';
        this.message = this.translate.instant(
          'The information you are about to share/export may contain sensitive data such us wallet IDs, addresses, balances, etc. Although this is not critical, please be careful and make sure you trust the person or entity you are sharing this information with.'
        );
        break;
      case 'fee-warning':
      this.title = this.translate.instant('Bitcoin miner fees unusually high');
        this.backButton = {};
        this.imgPath = 'assets/img/icon-warning.svg';
        this.message = this.translate.instant(
          'Bitcoin (BTC) miner fees are high due to record demand for limited space on the Bitcoin network. BitPay does not receive and does not control bitcoin miner fees.'
        );
        break;
    }
  }

  public close(data): void {
    this.viewCtrl.dismiss(data, null, { animate: false });
  }
}
