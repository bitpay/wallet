import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { CopayApp } from './app.component';
import { PAGES } from '../pages/pages';

@NgModule({
  declarations: [
    CopayApp,
    PAGES
  ],
  imports: [
    IonicModule.forRoot(CopayApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    CopayApp,
    PAGES
  ],
  providers: []
})
export class AppModule {}
