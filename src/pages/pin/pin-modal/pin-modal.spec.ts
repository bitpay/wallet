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

  describe('Lifecycle Hooks', () => {
    describe('ionViewWillEnter', () => {
      it('should set default status bar styling on iOS', () => {
        instance.platform.is.and.returnValue(true);
        const spy = spyOn(instance.statusBar, 'styleDefault');
        instance.platform.resume = new Subject();
        instance.platform.pause = new Subject();
        instance.ionViewWillEnter();
        instance.ionViewDidLoad();
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('ionViewWillLeave', () => {
      it('should style the status bar for light content on iOS', () => {
        instance.platform.is.and.returnValue(true);
        const spy = spyOn(instance.statusBar, 'styleLightContent');
        instance.platform.resume = new Subject();
        instance.platform.pause = new Subject();
        instance.ionViewWillLeave();
        instance.ionViewDidLoad();
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  describe('Methods', () => {
    describe('close', () => {
      it('should unregister the back button, and pop the page off the navigation stack', () => {
        const unregisterSpy = spyOn(instance, 'unregister');
        instance.close();
        instance.platform.resume = new Subject();
        instance.platform.pause = new Subject();
        instance.ionViewDidLoad();
        expect(unregisterSpy).toHaveBeenCalled();
        expect(instance.navCtrl.pop).toHaveBeenCalled();
      });
      it('should clear the countdown timer if it exists', () => {
        instance.countDown = setInterval(() => {}, 3000);
        const spy = spyOn(window, 'clearInterval');
        instance.platform.resume = new Subject();
        instance.platform.pause = new Subject();
        instance.close();
        instance.ionViewDidLoad();
        expect(spy).toHaveBeenCalledWith(instance.countDown);
      });
    });
  });
});
