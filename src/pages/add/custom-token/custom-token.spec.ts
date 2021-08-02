import { async, ComponentFixture } from '@angular/core/testing';
import { TestUtils } from '../../../test';
import { CustomTokenPage } from './custom-token';

describe('CustomTokenPage', () => {
  let fixture: ComponentFixture<CustomTokenPage>;
  /* let instance; */

  beforeEach(async(() => {
    return TestUtils.configurePageTestingModule([CustomTokenPage]).then(
      testEnv => {
        fixture = testEnv.fixture;
        fixture.detectChanges();
      }
    );
  }));
  afterEach(() => {
    fixture.destroy();
  });
});
