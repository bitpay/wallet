import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { BackupWarningPage } from './backup-warning';

@NgModule({
  declarations: [
    BackupWarningPage,
  ],
  imports: [
    IonicPageModule.forChild(BackupWarningPage),
  ],
})
export class BackupWarningPageModule {}
