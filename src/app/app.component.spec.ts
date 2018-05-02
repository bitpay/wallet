import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, TestBed } from '@angular/core/testing';
import { IonicModule, Platform } from 'ionic-angular';

import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { CopayApp } from './app.component';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule
} from '@ngx-translate/core';
import { EmailNotificationsProvider } from '../providers/email-notifications/email-notifications';
import { ProfileProvider } from '../providers/profile/profile';
import { ProvidersModule } from './../providers/providers.module';

describe('CopayApp', () => {
  let fixture;
  let component;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CopayApp],
        schemas: [NO_ERRORS_SCHEMA],
        imports: [
          IonicModule.forRoot(CopayApp),
          ProvidersModule,
          HttpClientTestingModule,
          TranslateModule.forRoot({
            loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
          })
        ]
      });
    })
  );

  beforeEach(async () => {
    fixture = TestBed.createComponent(CopayApp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component instanceof CopayApp).toBe(true);
  });

  describe('Methods', () => {
    describe('onProfileLoad', () => {
      let emailNotificationsProvider;
      beforeEach(() => {
        emailNotificationsProvider = TestBed.get(EmailNotificationsProvider);
        spyOn(emailNotificationsProvider, 'init');
      });
      it('should init email notifications', () => {
        component.onProfileLoad({});
        expect(emailNotificationsProvider.init).toHaveBeenCalled();
      });
      it('should create a new profile if none returned', () => {
        const profileProvider = TestBed.get(ProfileProvider);
        spyOn(profileProvider, 'createProfile');
        component.onProfileLoad();
        expect(profileProvider.createProfile).toHaveBeenCalled();
      });
    });
    describe('handleDeepLinksNW', () => {
      beforeEach(() => {
        (window as any).require = () => {
          return {
            App: {
              on: (event, cb) => {}
            }
          };
        };
      });
      afterEach(() => {
        delete (window as any).require;
      });
      it('should not break', () => {
        component.handleDeepLinksNW();
      });
    });
  });
});
