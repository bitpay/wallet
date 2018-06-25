import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestUtils } from '../../test';

import { PlatformProvider } from '../../providers';
import { EditableItemComponent } from './editable-item';

describe('UpdateMemoComponent', () => {
  let fixture: ComponentFixture<EditableItemComponent>;
  let instance: EditableItemComponent;
  let testBed: typeof TestBed;

  beforeEach(async(() =>
    TestUtils.configurePageTestingModule([EditableItemComponent]).then(
      testEnv => {
        fixture = testEnv.fixture;
        instance = testEnv.instance;
        testBed = testEnv.testBed;
        fixture.detectChanges();
      }
    )));
  afterEach(() => {
    fixture.destroy();
  });

  describe('Methods', () => {
    describe('#toggleValueUpdate', () => {
      it('should emit focus(true) if isCordova', async () => {
        testBed.get(PlatformProvider).isCordova = true;
        spyOn(instance.focus, 'emit');
        instance.toggleValueUpdate();
        expect(instance.focus.emit).toHaveBeenCalledWith(true);
      });
      it('should set isFocused to true', async () => {
        instance.isFocused = false;
        instance.toggleValueUpdate();
        expect(instance.isFocused).toEqual(true);
      });
    });
    describe('#saveValueNow', () => {
      it('should set isFocused to false and emit value', async () => {
        instance.isFocused = true;
        instance.value = 'sample memo';
        spyOn(instance.valChange, 'emit');
        instance.saveValueNow();
        expect(instance.isFocused).toEqual(false);
        expect(instance.valChange.emit).toHaveBeenCalledWith('sample memo');
      });
      it('should emit focus(false) if isCordova', async () => {
        testBed.get(PlatformProvider).isCordova = true;
        spyOn(instance.focus, 'emit');
        instance.saveValueNow();
        expect(instance.focus.emit).toHaveBeenCalledWith(false);
      });
    });
  });
});
