import { async, ComponentFixture } from '@angular/core/testing';

import { Subject } from 'rxjs';

import { TestUtils } from '../../../test';
import { PinModalPage } from './pin-modal';

describe('PinModalPage', () => {
  let fixture: ComponentFixture<PinModalPage>;
  let instance;

  beforeEach(async(() =>
    TestUtils.configurePageTestingModule([PinModalPage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      fixture.detectChanges();
    })));
  afterEach(() => {
    fixture.destroy();
  });

  describe('Methods', () => {
    describe('close', () => {
      it('should unregister the back button, and dismiss the modal', () => {
        const unregisterSpy = spyOn(instance, 'unregister');
        instance.close();
        instance.platform.resume = new Subject();
        instance.platform.pause = new Subject();
        instance.ionViewWillEnter();
        expect(unregisterSpy).toHaveBeenCalled();
        expect(instance.viewCtrl.dismiss).toHaveBeenCalled();
      });
      it('should clear the countdown timer if it exists', () => {
        instance.countDown = setInterval(() => {}, 3000);
        const spy = spyOn(window, 'clearInterval');
        instance.platform.resume = new Subject();
        instance.platform.pause = new Subject();
        instance.close();
        instance.ionViewWillEnter();
        expect(spy).toHaveBeenCalledWith(instance.countDown);
      });
    });
  });
});
