import { HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { IonicModule, IonicRouteStrategy, NavParams } from '@ionic/angular';
import { MissingTranslationHandler, MissingTranslationHandlerParams, TranslateDefaultParser, TranslateLoader, TranslateModule, TranslateParser } from '@ngx-translate/core';
import { env } from 'src/environments';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';


import { AppRoutingModule } from './app-routing.module';
import { CopayApp } from './app.component';
import { Animate } from './directives/animate/animate';
import { CopyToClipboard } from './directives/copy-to-clipboard/copy-to-clipboard';
import { ExternalizeLinks } from './directives/externalize-links/externalize-links';
import { FixedScrollBgColor } from './directives/fixed-scroll-bg-color/fixed-scroll-bg-color';
import { IonContentBackgroundColor } from './directives/ion-content-background-color/ion-content-background-color';
import { IonMask } from './directives/ion-mask/ion-mask';
import { LongPress } from './directives/long-press/long-press';
import { NavbarBg } from './directives/navbar-bg/navbar-bg';
import { NoLowFee } from './directives/no-low-fee/no-low-fee';
import { RevealAtScrollPosition } from './directives/reveal-at-scroll-pos/reveal-at-scroll-pos';
import { ScrolledIntoView } from './directives/scrolled-into-view/scrolled-into-view';
import { FormatCurrencyPipe, sharedPipes } from './pipes';
import { LanguageLoader } from './providers';
import { CustomErrorHandler } from './providers/custom-error-handler.service';
import { ProvidersModule } from './providers/providers.module';
import { NgxTextOverflowClampModule } from 'ngx-text-overflow-clamp';
import { MomentModule } from 'angular2-moment';
import { NgxBarcodeModule } from 'ngx-barcode';
import { NgxQRCodeModule } from '@techiediaries/ngx-qrcode';
import { MarkdownModule } from 'ngx-markdown';
import { COMPONENTS } from './components/components';
import { PAGES } from './pages/pages';

import { SwiperModule } from 'swiper/angular'

import { WebView } from '@ionic-native/ionic-webview/ngx';
import { IonicImageLoaderModule } from 'ionic-image-loader-v5';
import { enterAnimation } from './animations/nav-animation';

import { MatGridListModule } from '@angular/material/grid-list'; 

export function translateParserFactory() {
  return new InterpolatedTranslateParser();
}

export class InterpolatedTranslateParser extends TranslateDefaultParser {
  public templateMatcher: RegExp = /{\s?([^{}\s]*)\s?}/g;
}

export class MyMissingTranslationHandler implements MissingTranslationHandler {
  public parser: TranslateParser = translateParserFactory();
  public handle(params: MissingTranslationHandlerParams) {
    return this.parser.interpolate(params.key, params.interpolateParams);
  }
}

@NgModule({
  declarations: [
    /* Pipes */
    ...sharedPipes,
    // ...PAGES,
    ...COMPONENTS,
    ...PAGES,
    CopayApp,
     /* Directives */
    CopyToClipboard,
    ExternalizeLinks,
    FixedScrollBgColor,
    IonContentBackgroundColor,
    IonMask,
    LongPress,
    NavbarBg,
    NoLowFee,
    Animate,
    RevealAtScrollPosition,
    ScrolledIntoView,
    // WideHeaderBarButton,
  ],
  entryComponents: [CopayApp, ...PAGES, ...COMPONENTS],
  imports: [
    IonicModule.forRoot( {
      animated: env.enableAnimations,
      scrollPadding: false,
      backButtonIcon: 'arrow-round-back',
      backButtonText: '',
      navAnimation : enterAnimation
    }),
    MatGridListModule,
    FormsModule,
    ReactiveFormsModule,
    NgxTextOverflowClampModule,
    IonicImageLoaderModule,
    HttpClientModule,
    MarkdownModule.forRoot(),
    MomentModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule, 
    NgxBarcodeModule,
    NgxQRCodeModule,
    AppRoutingModule,
    ProvidersModule,
    SwiperModule,
    TranslateModule.forRoot({
      parser: { provide: TranslateParser, useFactory: translateParserFactory },
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: MyMissingTranslationHandler
      },
      loader: {
        provide: TranslateLoader,
        useClass: LanguageLoader
      }
    }),
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: env.name === 'production' })
  ],
  providers: [
    { 
      provide: RouteReuseStrategy, 
      useClass: IonicRouteStrategy 
    },
    {
      provide: ErrorHandler,
      useClass: CustomErrorHandler
    },
    FormatCurrencyPipe,
    NavParams,
    FormBuilder,
    WebView
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [CopayApp],
})
export class AppModule {}
