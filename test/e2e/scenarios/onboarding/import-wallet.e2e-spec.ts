import { $, browser, by, element, ExpectedConditions as EC } from 'protractor';
import {
  clearStorage,
  expectPage,
  sendKeys,
  takeScreenshot,
  waitForIonAlert,
  waitForIonicPage
} from '../../utils';

describe('Onboarding: Import Wallet', () => {
  beforeEach(async () => {
    await browser.get('');
    await element(by.partialButtonText('backup')).click();
    await waitForIonicPage('import-wallet');
  });
  afterEach(clearStorage);

  it('initially shows words view', async () => {
    await expectPage('import-wallet');
    await element(
      by.cssContainingText('ion-label', 'advanced options')
    ).click();
    await takeScreenshot('import-wallet-advanced');
  });

  it('has file view', async () => {
    await element(by.css('ion-segment-button[value=file]')).click();
    await takeScreenshot('import-wallet-file');
    await element(
      by.cssContainingText('ion-label', 'advanced options')
    ).click();
    await takeScreenshot('import-wallet-file-advanced');
  });

  describe('Restore from 12 word backup', () => {
    const backup = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong';
    it('with encryption', async () => {
      await sendKeys(
        element(by.css(`textarea[formcontrolname=words]`)),
        backup
      );
      await element(by.css('ion-footer')).click();
      await waitForIonAlert();
      await takeScreenshot('import-wallet-with-encryption');
      await element(
        by.cssContainingText('ion-alert .alert-button', 'Yes')
      ).click();
      await waitForIonAlert();
      const p = 'hunter2';
      await sendKeys(element(by.css('ion-alert input.alert-input')), p);
      await takeScreenshot('import-wallet-with-encryption-input');
      await element(
        by.cssContainingText('ion-alert .alert-button', 'Ok')
      ).click();
      await waitForIonAlert();
      await sendKeys(element(by.css('ion-alert input.alert-input')), p);
      await takeScreenshot('import-wallet-with-encryption-input-confirm');
      // TODO: language: 'Ok' -> 'Confirm'
      await element(
        by.cssContainingText('ion-alert .alert-button', 'Ok')
      ).click();
    });
    it('without encryption', async () => {
      await sendKeys(
        element(by.css(`textarea[formcontrolname=words]`)),
        backup
      );
      await element(by.css('ion-footer')).click();
      await waitForIonAlert();
      await element(
        by.cssContainingText('ion-alert .alert-button', 'No')
      ).click();
      await waitForIonAlert();
      await element(
        by.cssContainingText('ion-alert .alert-button', "I'm sure")
      ).click();
      // There's something strange going on here which tricks Protractor into
      // waiting forever on Angular.
      await browser.waitForAngularEnabled(false);
      await browser.wait(EC.presenceOf($('page-home')), 5000);
      // give it a second to render before the screenshot
      await browser.sleep(1000);
      await expectPage('home');
      await browser.waitForAngularEnabled(true);
    });
  });
});
