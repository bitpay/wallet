import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, TestBed } from '@angular/core/testing';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule
} from '@ngx-translate/core';
import { IonicModule } from 'ionic-angular';

import { EmailNotificationsProvider } from '../providers/email-notifications/email-notifications';
import { Logger } from '../providers/logger/logger';
import { LoggerMock } from '../providers/logger/logger.mock';
import { ProfileProvider } from '../providers/profile/profile';
import { ProvidersModule } from './../providers/providers.module';
import { CopayApp } from './app.component';

describe('CopayApp', () => {
  let fixture;
  let component;

  beforeEach(async(() => {
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
      ],
      providers: [{ provide: Logger, useClass: LoggerMock }]
    });
  }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(CopayApp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    spyOn(component, 'ngOnDestroy');
    fixture.destroy();
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
    /* TODO describe('handleDeepLinksNW', () => {
      beforeEach(() => {
        (window as any).require = () => {
          return {
            App: {
              on: () => {},
              argv: ['URL']
            }
          };
        };
        (window as any)._urlHandled = false;
      });
      afterEach(() => {
        delete (window as any).require;
        delete (window as any)._urlHandled;
      });
      it('should not try to handle deeplinks if was already handled', () => {
        jasmine.clock().install();
        const spy = spyOn(component, 'handleOpenUrl');
        component.handleDeepLinksNW();
        jasmine.clock().tick(1001);

        component.handleDeepLinksNW();
        jasmine.clock().tick(1001);

        expect(spy).toHaveBeenCalledTimes(1);
        jasmine.clock().uninstall();
      });
    }); */
  });
});
