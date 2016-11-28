import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';

import { CoreModule } from './core/core.module'
import { CopayApp } from './app.component';
import { PAGES } from '../pages/pages';

@NgModule({
  declarations: [
    CopayApp,
    PAGES
  ],
  imports: [
    IonicModule.forRoot(CopayApp),
		CoreModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    CopayApp,
    PAGES
  ],
  providers: []
})
export class AppModule {}
