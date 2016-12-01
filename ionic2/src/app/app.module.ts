import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';

import { CoreModule } from './core/core.module'
import { CopayApp } from './app.component';
import { PAGES } from '../pages/pages';

import { PlatformInfo } from '../services/platform-info.service';
import { ScannerService } from '../services/scanner.service';

import { Logger, Options as LoggerOptions, Level as LoggerLevel } from "angular2-logger/core";


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
  providers: [
    Logger,
    { provide: LoggerOptions, useValue: { level: LoggerLevel.LOG } },
    PlatformInfo,
    ScannerService
  ]
})
export class AppModule {}
