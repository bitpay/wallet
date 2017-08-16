import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { BackupRequestPage } from './backup-request';

@NgModule({
  declarations: [
    BackupRequestPage,
  ],
  imports: [
    IonicPageModule.forChild(BackupRequestPage),
  ],
})
export class BackupRequestPageModule {}
