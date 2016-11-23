import { browser, element, by } from 'protractor';

describe('CopayApp', () => {

  beforeEach(() => {
    browser.get('');
  });

  it('should have a title', () => {
    expect(browser.getTitle()).toEqual('Home');
  });
});
