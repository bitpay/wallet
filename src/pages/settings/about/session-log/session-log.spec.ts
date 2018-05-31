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

import { CustomModalComponent } from '../../../../components/custom-modal/custom-modal';

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
        spyOn(instance.configProvider, 'get');
        instance.ionViewWillEnter();
        expect(instance.configProvider.get).toBeDefined();
      });
      it('should set correct filter value when config has log weight', () => {
        spyOn(instance.logger, 'getWeight').and.returnValue({ weight: 21 });

        instance.config = {
          log: {
            weight: 100
          }
        };

        instance.ionViewWillEnter();
        expect(instance.filterValue).toEqual(21);
      });
      it('should set default filter value when config does not have log weight', () => {
        spyOn(instance.logger, 'getDefaultWeight').and.returnValue({
          weight: 10
        });

        instance.config = {};

        instance.ionViewWillEnter();

        expect(instance.filterValue).toEqual(10);
      });
      it('should call setOptionSelected with correct param', () => {
        spyOn(instance, 'setOptionSelected');
        spyOn(instance.logger, 'getDefaultWeight').and.returnValue({
          weight: 10
        });

        instance.config = {};

        instance.ionViewWillEnter();

        expect(instance.setOptionSelected).toHaveBeenCalledWith(10);
      });
      it('should call filterLogs with correct param', () => {
        spyOn(instance, 'filterLogs');
        spyOn(instance.logger, 'getDefaultWeight').and.returnValue({
          weight: 10
        });

        instance.config = {};

        instance.ionViewWillEnter();

        expect(instance.filterLogs).toHaveBeenCalledWith(10);
      });
    });
    describe('ionViewDidLoad', () => {
      it('should log debug info', () => {
        spyOn(instance.logger, 'info');
        instance.ionViewDidLoad();
        expect(instance.logger.info).toHaveBeenCalledWith(
          'ionViewDidLoad SessionLogPage'
        );
      });
    });
  });
  describe('Methods', () => {
    describe('#filterLogs', () => {
      it('should set filtered logs correctly', () => {
        spyOn(instance.logger, 'get').and.returnValue({
          weight: 10
        });
        instance.filterLogs(21);
        expect(instance.filteredLogs).toEqual({ weight: 10 });
        expect(instance.logger.get).toHaveBeenCalledWith(21);
      });
    });
    describe('#setOptionSelected', () => {
      it('should call filterLogs with correct param', () => {
        spyOn(instance, 'filterLogs');

        instance.setOptionSelected(21);

        expect(instance.filterLogs).toHaveBeenCalledWith(21);
      });
      it('should set config with correct opts', () => {
        spyOn(instance.configProvider, 'set');
        const opts = {
          log: {
            weight: 10
          }
        };

        instance.setOptionSelected(10);

        expect(instance.configProvider.set).toHaveBeenCalledWith(opts);
      });
    });
    describe('#prepareLogs', () => {
      it('should return correct log', () => {
        spyOn(instance.logger, 'get').and.returnValue([
          {
            timestamp: '01/07/2008',
            level: 1,
            msg: 'msg'
          }
        ]);
        const log = instance.prepareLogs();

        expect(log).toEqual(
          'Copay Session Logs\n Be careful, this could contain sensitive private data\n\n\n\n[01/07/2008][1]msg'
        );
      });
    });
    describe('#sendLogs', () => {
      it('should send logs', () => {
        spyOn(instance, 'prepareLogs').and.returnValue('logs');
        spyOn(instance.socialSharing, 'shareViaEmail');

        instance.sendLogs();

        expect(instance.socialSharing.shareViaEmail).toHaveBeenCalledWith(
          'logs',
          'Copay Logs',
          null,
          null,
          null,
          null
        );
      });
    });
    describe('prepareLogs function', () => {
      it('should return log', () => {
        const logger = testBed.get(Logger);
        expect(instance.prepareLogs()).toContain('Copay');
      });
    });
    describe('#showOptionsMenu', () => {
      it('should create actionSheet', () => {
        instance.showOptionsMenu();

        expect(instance.actionSheetCtrl.create).toHaveBeenCalled();
      });
    });
    describe('#showWarningModal', () => {
      it('should create warning modal', () => {
        instance.showWarningModal();

        expect(instance.modalCtrl.create).toHaveBeenCalledWith(
          CustomModalComponent,
          { modal: 'sensitive-info' },
          { cssClass: 'fullscreen-modal' }
        );
      });
    });
  });
});
