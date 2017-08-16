import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DisclaimerPage } from './disclaimer';

@NgModule({
  declarations: [
    DisclaimerPage,
  ],
  imports: [
    IonicPageModule.forChild(DisclaimerPage),
  ],
})
export class DisclaimerPageModule {}
