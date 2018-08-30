import { Component, ElementRef } from '@angular/core';
import { async, ComponentFixture } from '@angular/core/testing';
import { TestUtils } from '../../test';
import { IosFixedBgColor } from './ios-fixed-bg-color';

let fixture: ComponentFixture<TestHostComponent>;
let instance;
let fixedContent;

@Component({
  template: `<ion-content [ios-fixed-bg-color]="color"></ion-content>`
})
class TestHostComponent {
  color: string = 'blue';
  constructor(public element: ElementRef) {}
}

describe('IosFixedBgColor', () => {
  beforeEach(async(() =>
    TestUtils.beforeEachCompiler([TestHostComponent, IosFixedBgColor]).then(
      compiled => {
        fixture = compiled.fixture;
        instance = compiled.instance;
        fixture.detectChanges();
        fixedContent = instance.element.nativeElement.getElementsByClassName(
          'fixed-content'
        )[0];
      }
    )));
  afterEach(() => {
    fixture.destroy();
  });
  it('should set fixed-content background-image to a linear gradient with specified color', () => {
    const backgroundImage =
      'linear-gradient(blue, blue 50%, rgb(248, 248, 249) 50%, rgb(248, 248, 249) 50%, rgb(248, 248, 249) 50%)';
    expect(fixedContent.style.backgroundImage).toBe(backgroundImage);
  });
  it('should remove background-image if none specified', () => {
    instance.color = null;
    fixture.detectChanges();
    expect(fixedContent.style.backgroundImage).toBe('');
  });
});
