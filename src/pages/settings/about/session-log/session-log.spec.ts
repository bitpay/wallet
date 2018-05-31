import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestUtils } from '../../../../test';

import { ConfigProvider } from './../../../../providers/config/config';
import { SessionLogPage } from './session-log';

describe('SessionLogPage', () => {
  let fixture: ComponentFixture<SessionLogPage>;
  let instance: any;
  let testBed: typeof TestBed;

  beforeEach(async(() => {
    TestUtils.configurePageTestingModule([SessionLogPage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      testBed = testEnv.testBed;
      fixture.detectChanges();
    });
  }));
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
      expect(instance.prepareLogs()).toContain('Copay');
    });
  });
});
