import { async, ComponentFixture } from '@angular/core/testing';

import { TestUtils } from '../../test';

import { TxDetailsPage } from './tx-details';

describe('TxDetailsPage', () => {
  let fixture: ComponentFixture<TxDetailsPage>;
  let instance: TxDetailsPage;

  beforeEach(async(() =>
    TestUtils.configurePageTestingModule([TxDetailsPage]).then(testEnv => {
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
        await instance.saveMemoInfo('new memo');
        expect(instance.btx.note.body).toEqual('new memo');
      });
    });
  });
});
