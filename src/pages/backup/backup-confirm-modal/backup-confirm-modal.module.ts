import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { BackupConfirmModalPage } from './backup-confirm-modal';

@NgModule({
  declarations: [
    BackupConfirmModalPage,
  ],
  imports: [
    IonicPageModule.forChild(BackupConfirmModalPage),
  ],
})
export class BackupConfirmModalPageModule {}
