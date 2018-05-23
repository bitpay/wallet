import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed
} from '@angular/core/testing';

import { Subject } from 'rxjs';

import { TestUtils } from '../../../../test';

import { Exception } from '@zxing/library';
import { ActionSheetController, ModalController } from 'ionic-angular';
import { ActionSheetControllerMock, ModalControllerMock } from 'ionic-mocks';
import { Logger } from '../../../../providers/logger/logger';
import { PlatformProvider } from '../../../../providers/platform/platform';
import { ConfigProvider } from './../../../../providers/config/config';
import { SessionLogPage } from './session-log';

describe('SessionLogPage', () => {
  let fixture: ComponentFixture<SessionLogPage>;
  let instance: any;
  let testBed: typeof TestBed;

  beforeEach(
    async(() => {
      TestUtils.configurePageTestingModule([SessionLogPage]).then(testEnv => {
        fixture = testEnv.fixture;
        instance = testEnv.instance;
        testBed = testEnv.testBed;
        fixture.detectChanges();
      });
    })
  );
  afterEach(() => {
    fixture.destroy();
  });

  describe('Lifecycle Hooks', () => {
    describe('ionViewWillEnter', () => {
      it('should set weight on configProvider when view enter', () => {
        const configProvider = testBed.get(ConfigProvider);
        instance.ionViewWillEnter();
        expect(configProvider.get()).toBeDefined();
      });
    });
  });
  describe('prepareLogs function', () => {
    it('should return log', () => {
      const logger = testBed.get(Logger);
      expect(instance.prepareLogs()).toContain('Copay');
    });
  });
});
