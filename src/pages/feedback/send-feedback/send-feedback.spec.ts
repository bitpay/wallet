import { async, ComponentFixture } from '@angular/core/testing';

import { TestUtils } from '../../../test';
import { SendFeedbackPage } from './send-feedback';

describe('SendFeedbackPage', () => {
  let fixture: ComponentFixture<SendFeedbackPage>;
  let instance;

  beforeEach(async(() =>
    TestUtils.configurePageTestingModule([SendFeedbackPage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      fixture.detectChanges();
    })));
  afterEach(() => {
    fixture.destroy();
  });

  describe('Methods', () => {
    describe('#showAppreciationSheet', () => {
      it('should create new info sheet', () => {
        const appSheet = spyOn(
          instance.actionSheetProvider,
          'createInfoSheet'
        ).and.returnValue({
          present() {},
          onDidDismiss() {}
        });
        instance.showAppreciationSheet();
        expect(appSheet).toHaveBeenCalledWith('appreciate-review', {
          storeName: 'App Store'
        });
      });
    });
    describe('#openExternalLink', () => {
      it('should open external link with correct arguments', () => {
        const openLink = spyOn(instance.externalLinkProvider, 'open');
        instance.openExternalLink('https://bitpay.canny.io');
        expect(openLink).toHaveBeenCalledWith('https://bitpay.canny.io');
      });
    });
  });
});
