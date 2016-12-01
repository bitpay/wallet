import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { Logger, Options as LoggerOptions, Level as LoggerLevel } from "angular2-logger/core";

import { CoreModule } from './core/core.module'
import { CopayApp } from './app.component';
import { PAGES } from '../pages/pages';
import { SERVICES } from '../services/services';

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
    SERVICES
  ]
})
export class AppModule {}
