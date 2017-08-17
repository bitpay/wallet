import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { BackupWarningModalPage } from './backup-warning-modal';

@NgModule({
  declarations: [
    BackupWarningModalPage,
  ],
  imports: [
    IonicPageModule.forChild(BackupWarningModalPage),
  ],
})
export class BackupWarningModalPageModule {}
