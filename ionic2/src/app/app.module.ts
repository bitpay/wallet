import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { CopayApp } from './app.component';
import { PAGES } from '../pages/pages';

import { PlatformInfo } from '../services/platform-info.service';
import { ScannerService } from '../services/scanner.service';

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
  providers: [
    PlatformInfo,
    ScannerService
  ]
})
export class AppModule {}
