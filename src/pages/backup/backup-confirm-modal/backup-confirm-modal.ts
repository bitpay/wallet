import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

@Component({
  selector: 'page-backup-confirm-modal',
  templateUrl: 'backup-confirm-modal.html',
})
export class BackupConfirmModalPage {

  constructor(public viewCtrl: ViewController) {
  }

  ionViewDidLoad() {
  }

  closeBackupResultModal() {
    // TODO waiting for bwc
    // profileService.isDisclaimerAccepted(function(val) {
    //   if (val) {
    //     $ionicHistory.removeBackView();
    //     $state.go('tabs.home');
    //   } else $state.go('onboarding.disclaimer', {
    //     walletId: $stateParams.walletId,
    //     backedUp: true
    //   });
    // });
    this.viewCtrl.dismiss();
  }

}
