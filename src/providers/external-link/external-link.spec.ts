import { TestBed } from '@angular/core/testing';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService
} from '@ngx-translate/core';
import { AlertController, App, Config, Platform } from 'ionic-angular';

import { HttpClientModule } from '@angular/common/http';
import { Logger } from '../../providers/logger/logger';
import { NodeWebkitProvider } from '../node-webkit/node-webkit';
import { PlatformProvider } from '../platform/platform';
import { PopupProvider } from '../popup/popup';
import { ExternalLinkProvider } from './external-link';

describe('Provider: External Link Provider', () => {
  let externalLinkProvider: ExternalLinkProvider;
  let url = 'https://github.com/bitpay/copay/releases/latest';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })
      ],
      providers: [
        AlertController,
        App,
        Config,
        Logger,
        Platform,
        PlatformProvider,
        PopupProvider,
        ExternalLinkProvider,
        NodeWebkitProvider,
        TranslateService
      ]
    });
    externalLinkProvider = TestBed.get(ExternalLinkProvider);
  });

  describe('open', () => {
    it('should open browser without options', () => {
      externalLinkProvider.open(url).then(() => {
        expect().nothing();
      });
    });
  });
});
