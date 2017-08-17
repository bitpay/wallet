import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { BackupGamePage } from './backup-game';

@NgModule({
  declarations: [
    BackupGamePage,
  ],
  imports: [
    IonicPageModule.forChild(BackupGamePage),
  ],
})
export class BackupGamePageModule {}
