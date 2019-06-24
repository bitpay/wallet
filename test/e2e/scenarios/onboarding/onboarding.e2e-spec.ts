import { browser, by, element } from 'protractor';
import {
  clearStorage,
  disableCSSAnimations,
  expectPage,
  ionicPageIs
} from '../../utils';

describe('Onboarding: Landing', () => {
  beforeEach(async () => {
    await browser.get('');
    await disableCSSAnimations();
  });
  afterEach(clearStorage);

  it('Should render the landing page', async () => {
    await expectPage('onboarding');
  });

  it('On restart, should return to the landing page if wallet has not been created', async () => {
    await ionicPageIs('onboarding');
  });
});
