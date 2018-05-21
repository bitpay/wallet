import { DecimalPipe } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

/* Modules */
import { TranslatePoHttpLoader } from '@biesbjerg/ngx-translate-po-http-loader';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { MomentModule } from 'angular2-moment';
import { NgxQRCodeModule } from 'ngx-qrcode2';

/* Copay App */
import env from '../environments';
import { CopayApp } from './app.component';

import { PAGES } from './../pages/pages';

/* Pipes */
import { FiatToUnitPipe } from '../pipes/fiatToUnit';
import { KeysPipe } from '../pipes/keys';
import { OrderByPipe } from '../pipes/order-by';
import { SatToFiatPipe } from '../pipes/satToFiat';
import { SatToUnitPipe } from '../pipes/satToUnit';

/* Directives */
import { Animate } from '../directives/animate/animate';
import { CopyToClipboard } from '../directives/copy-to-clipboard/copy-to-clipboard';
import { IosScrollBgColor } from '../directives/ios-scroll-bg-color/ios-scroll-bg-color';
import { LongPress } from '../directives/long-press/long-press';
import { NavbarBg } from '../directives/navbar-bg/navbar-bg';
import { NoLowFee } from '../directives/no-low-fee/no-low-fee';

/* Components */
import { ComponentsModule } from './../components/components.module';

/* Providers */
import { ProvidersModule } from './../providers/providers.module';

/* Read translation files */
export function createTranslateLoader(http: HttpClient) {
  return new TranslatePoHttpLoader(http, 'assets/i18n/po', '.po');
}

@NgModule({
  declarations: [
    CopayApp,
    ...PAGES,
    /* Directives */
    CopyToClipboard,
    IosScrollBgColor,
    LongPress,
    NavbarBg,
    NoLowFee,
    Animate,
    /* Pipes */
    SatToUnitPipe,
    SatToFiatPipe,
    FiatToUnitPipe,
    KeysPipe,
    OrderByPipe
  ],
  imports: [
    IonicModule.forRoot(CopayApp, {
      animate: env.enableAnimations,
      tabsHideOnSubPages: true,
      tabsPlacement: 'bottom',
      backButtonIcon: 'arrow-round-back',
      backButtonText: ''
    }),
    BrowserModule,
    ComponentsModule,
    HttpClientModule,
    MomentModule,
    NgxQRCodeModule,
    ProvidersModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    }),
    ZXingScannerModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [CopayApp, ...PAGES],
  providers: [
    {
      provide: ErrorHandler,
      useClass: IonicErrorHandler
    }
  ]
})
export class AppModule {}
