import { async, ComponentFixture } from '@angular/core/testing';

import { TestUtils } from '../../../test';

import { FeePolicyPage } from './fee-policy';

describe('FeePolicyPage', () => {
  let fixture: ComponentFixture<FeePolicyPage>;
  let instance;

  beforeEach(async(() =>
    TestUtils.configurePageTestingModule([FeePolicyPage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      fixture.detectChanges();
    })));
  afterEach(() => {
    fixture.destroy();
  });
  describe('Lifecycle Hooks', () => {
    describe('ionViewDidEnter', () => {
      beforeEach(() => {
        spyOn(instance.logger, 'error');
        spyOn(instance, 'updateCurrentValues');
      });
      it('should set new fee level and update current values', async () => {
        const data = { levels: 'test val' };

        spyOn(instance.feeProvider, 'getFeeLevels').and.returnValue(
          Promise.resolve(data)
        );

        await instance.ionViewDidEnter();

        expect(instance.updateCurrentValues).toHaveBeenCalled();
        expect(instance.feeLevels).toEqual('test val');
      });
      it('should log and set new error if getFeeLevels fails', async () => {
        spyOn(instance.feeProvider, 'getFeeLevels').and.returnValue(
          Promise.reject('bad error')
        );

        await instance.ionViewDidEnter();

        expect(instance.logger.error).toHaveBeenCalled();
        expect(instance.error).toEqual('bad error');
      });
    });
  });
  describe('Methods', () => {
    describe('#save', () => {
      beforeEach(() => {
        spyOn(instance.logger, 'debug');
        spyOn(instance, 'updateCurrentValues');
        spyOn(instance, 'setFee');
        spyOn(instance.feeProvider, 'getCurrentFeeLevel').and.returnValue(
          'urgent'
        );
      });
      it('should do nothing if current fee level is empty', () => {
        instance.currentFeeLevel = null;
        instance.save();

        expect(instance.logger.debug).not.toHaveBeenCalled();
        expect(instance.updateCurrentValues).not.toHaveBeenCalled();
        expect(instance.setFee).not.toHaveBeenCalled();
      });
      it('should do nothing if current fee level equals existing fee level', () => {
        instance.currentFeeLevel = 'urgent';
        instance.save();

        expect(instance.logger.debug).not.toHaveBeenCalled();
        expect(instance.updateCurrentValues).not.toHaveBeenCalled();
        expect(instance.setFee).not.toHaveBeenCalled();
      });
      it('should log new fee level, update current values, and set new fee level', () => {
        instance.currentFeeLevel = 'normal';
        instance.save();

        expect(instance.logger.debug).toHaveBeenCalled();
        expect(instance.updateCurrentValues).toHaveBeenCalled();
        expect(instance.setFee).toHaveBeenCalled();
      });
    });
    describe('#setFee', () => {
      beforeEach(() => {
        spyOn(instance.configProvider, 'set');
      });
      it('should set new fee level with correct params', () => {
        instance.currentFeeLevel = 'normal';
        instance.setFee();
        const opts = {
          wallet: {
            settings: {
              feeLevel: 'normal'
            }
          }
        };
        expect(instance.configProvider.set).toHaveBeenCalledWith(opts);
      });
    });
    describe('#updateCurrentValues', () => {
      beforeEach(() => {
        instance.feePerSatByte = 'test1';
        instance.avgConfirmationTime = 'test2';
      });
      it('should not change feePerSatByte and avgConfirmationTime if currentFeeLevel is empty', () => {
        instance.currentFeeLevel = null;
        instance.feeLevels = {
          livenet: [{ level: 'normal', feePerKb: 10000, nBlocks: 3 }]
        };

        instance.updateCurrentValues();

        expect(instance.feePerSatByte).toEqual('test1');
        expect(instance.avgConfirmationTime).toEqual('test2');
      });
      it('should not change feePerSatByte and avgConfirmationTime if feeLevels is empty', () => {
        instance.currentFeeLevel = 'normal';
        instance.feeLevels = null;

        instance.updateCurrentValues();

        expect(instance.feePerSatByte).toEqual('test1');
        expect(instance.avgConfirmationTime).toEqual('test2');
      });
      it('should not change feePerSatByte and avgConfirmationTime if currentFeeLevel data cannot be found', () => {
        instance.currentFeeLevel = 'urgent';
        instance.feeLevels = {
          livenet: [{ level: 'normal', feePerKb: 10000, nbBlocks: 3 }]
        };

        instance.updateCurrentValues();

        expect(instance.feePerSatByte).toEqual('test1');
        expect(instance.avgConfirmationTime).toEqual('test2');
      });
      it('should set feePerSatByte and avgConfirmationTime to correct values', () => {
        instance.currentFeeLevel = 'normal';
        instance.feeLevels = {
          livenet: [{ level: 'normal', feePerKb: 10500, nbBlocks: 3 }]
        };

        instance.updateCurrentValues();

        expect(instance.feePerSatByte).toEqual('11');
        expect(instance.avgConfirmationTime).toEqual(30);
      });
    });
  });
});
