import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DisclaimerModalPage } from './disclaimer-modal';

@NgModule({
  declarations: [
    DisclaimerModalPage,
  ],
  imports: [
    IonicPageModule.forChild(DisclaimerModalPage),
  ],
})
export class DisclaimerModalPageModule {}
