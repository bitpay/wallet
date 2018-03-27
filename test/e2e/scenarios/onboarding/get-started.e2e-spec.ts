import { $, browser, by, element, ExpectedConditions as EC } from 'protractor';
import {
  clearStorage,
  disableAnimations,
  expectPage,
  ionicPageIs,
  sendKeys,
  takeScreenshot,
  waitForIonAlert,
  waitForIonicPage
} from '../../utils';

describe('Onboarding: Get Started', () => {
  afterEach(clearStorage);
  beforeEach(async () => {
    await browser.get('');
    await disableAnimations();
  });

  // The onboarding mega-test. Try everything:
  it('Should allow the user to navigate intro screens', async () => {
    await element(by.buttonText('Get started')).click();
    expect(await element(by.css('.swiper-slide-active h3')).getText()).toEqual(
      'Bitcoin is secure, digital money.'
    );
    await expectPage('tour');
    await element(by.buttonText('Got it')).click();
    expect(await element(by.css('.swiper-slide-active h3')).getText()).toEqual(
      'Bitcoin is a currency.'
    );
    await takeScreenshot('tour-2');
    await element(by.buttonText('Makes sense')).click();
    expect(await element(by.css('.swiper-slide-active h3')).getText()).toEqual(
      'You control your bitcoin.'
    );
    await takeScreenshot('tour-3');

    // TODO,FIXME: breaks in e2e tests, but not in manual testing
    // await (await element(by.css('ion-navbar .back-button'))).click();
    // expect(await element(by.css('.swiper-slide-active h3')).getText()).toEqual(
    //   'Bitcoin is a currency.'
    // );
    // await (element(by.buttonText('Makes sense'))).click();

    await element(by.buttonText('Create bitcoin wallet')).click();
    await waitForIonAlert();
    await takeScreenshot('tour-3-encryption-request');
    await element(
      by.cssContainingText('ion-alert .alert-button', 'No')
    ).click();
    await waitForIonAlert();
    await takeScreenshot('tour-3-encryption-request-decline');
    await element(
      by.cssContainingText('ion-alert .alert-button', 'Go Back')
    ).click();
    await waitForIonAlert();
    await takeScreenshot('tour-3-encryption-request-input');
    const p = 'hunter2';
    await sendKeys(element(by.css('ion-alert input.alert-input')), p);
    await element(
      by.cssContainingText('ion-alert .alert-button', 'Ok')
    ).click();
    await waitForIonAlert();
    await takeScreenshot('tour-3-encryption-request-input-confirm');
    // Cancel the first time, make sure we get another chance
    await element(
      by.cssContainingText('ion-alert .alert-button', 'Cancel')
    ).click();
    await waitForIonAlert();
    // try again, confirm our password this time
    await sendKeys(element(by.css('ion-alert input.alert-input')), p);
    await element(
      by.cssContainingText('ion-alert .alert-button', 'Ok')
    ).click();
    await waitForIonAlert();
    await sendKeys(element(by.css('ion-alert input.alert-input')), p);
    // TODO: language: 'Ok' -> 'Confirm'
    await element(
      by.cssContainingText('ion-alert .alert-button', 'Ok')
    ).click();
    // There's something strange going on here which tricks Protractor into
    // waiting forever on Angular.
    await browser.waitForAngularEnabled(false);
    await browser.wait(EC.presenceOf($('page-collect-email')), 5000);
    expect(await element(by.css('page-collect-email h3')).getText()).toEqual(
      'Notifications by email'
    );
    // give it a second to render before the screenshot
    await browser.sleep(1000);
    await expectPage('collect-email');
    await browser.waitForAngularEnabled(true);
    // TODO: complete onboarding process
  });

  // Our goal for this test is to click all the "Skip" buttons, and get through
  // onboarding as quickly as possible.
  it('Should allow the user to skip through much of the onboarding process', async () => {
    await element(by.buttonText('Get started')).click();
    expect(await element(by.css('.swiper-slide-active h3')).getText()).toEqual(
      'Bitcoin is secure, digital money.'
    );
    await waitForIonicPage('tour');
    await element(by.buttonText('Skip')).click();
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
    await browser.wait(EC.presenceOf($('page-collect-email')), 5000);
    expect(await element(by.css('page-collect-email h3')).getText()).toEqual(
      'Notifications by email'
    );
    await browser.waitForAngularEnabled(true);
    // TODO: complete onboarding process
  });
});
