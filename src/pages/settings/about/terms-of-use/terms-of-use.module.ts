import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TermsOfUsePage } from './terms-of-use';

@NgModule({
  declarations: [
    TermsOfUsePage,
  ],
  imports: [
    IonicPageModule.forChild(TermsOfUsePage),
  ],
  exports: [
      TermsOfUsePage
  ]
})
export class TermsOfUsePageModule {}
