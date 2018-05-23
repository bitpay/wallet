import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed
} from '@angular/core/testing';

import { TestUtils } from '../../../test';
import { PinModalPage } from './pin-modal';

describe('PinModalPage', () => {
  let fixture: ComponentFixture<PinModalPage>;
  let instance: any;
  let testBed: typeof TestBed;

  beforeEach(
    async(() =>
      TestUtils.configurePageTestingModule([PinModalPage]).then(testEnv => {
        fixture = testEnv.fixture;
        instance = testEnv.instance;
        testBed = testEnv.testBed;
        fixture.detectChanges();
      })
    )
  );
  afterEach(() => {
    fixture.destroy();
  });

  describe('Lifecycle Hooks', () => {
    describe('ionViewWillEnter', () => {
      it('should set default status bar styling on iOS', () => {
        instance.platform.is.and.returnValue(true);
        const spy = spyOn(instance.statusBar, 'styleDefault');
        instance.ionViewWillEnter();
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('ionViewWillLeave', () => {
      it('should style the status bar for light content on iOS', () => {
        instance.platform.is.and.returnValue(true);
        const spy = spyOn(instance.statusBar, 'styleLightContent');
        instance.ionViewWillLeave();
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  describe('Methods', () => {
    describe('close', () => {
      it('should unregister the back button, and pop the page off the navigation stack', () => {
        const unregisterSpy = spyOn(instance, 'unregister');
        instance.close();
        expect(unregisterSpy).toHaveBeenCalled();
        expect(instance.navCtrl.pop).toHaveBeenCalled();
      });
      it('should clear the countdown timer if it exists', () => {
        instance.countDown = setInterval(() => {}, 3000);
        const spy = spyOn(window, 'clearInterval');
        instance.close();
        expect(spy).toHaveBeenCalledWith(instance.countDown);
      });
    });
  });
});
