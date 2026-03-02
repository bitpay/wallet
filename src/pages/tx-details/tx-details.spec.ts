import { async, ComponentFixture } from '@angular/core/testing';

import { TestUtils } from '../../test';

import { TxDetailsModal } from './tx-details';

describe('TxDetailsModal', () => {
  let fixture: ComponentFixture<TxDetailsModal>;
  let instance: TxDetailsModal;

  beforeEach(async(() =>
    TestUtils.configurePageTestingModule([TxDetailsModal]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      fixture.detectChanges();
    })));
  afterEach(() => {
    fixture.destroy();
  });

  describe('Methods', () => {
    describe('#saveMemoInfo', () => {
      it('should set btx note body to the new txMemo', async () => {
        instance.btx = { note: {} };
        instance.txMemo = 'new memo';
        await instance.saveMemoInfo();
        expect(instance.btx.note.body).toEqual('new memo');
      });
    });
  });
});
