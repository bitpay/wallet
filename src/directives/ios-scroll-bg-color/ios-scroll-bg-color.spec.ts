import { Component, ElementRef } from '@angular/core';
import { async, ComponentFixture } from '@angular/core/testing';
import { TestUtils } from '../../test';
import { IosScrollBgColor } from './ios-scroll-bg-color';

let fixture: ComponentFixture<TestHostComponent>;
let instance;
let scrollContent;

@Component({
  template: `<ion-content [ios-scroll-bg-color]="color"></ion-content>`
})
class TestHostComponent {
  color: string = 'blue';
  constructor(public element: ElementRef) {}
}

describe('IosScrollBgColor', () => {
  beforeEach(async(() =>
    TestUtils.beforeEachCompiler([TestHostComponent, IosScrollBgColor]).then(
      compiled => {
        fixture = compiled.fixture;
        instance = compiled.instance;
        fixture.detectChanges();
        scrollContent = instance.element.nativeElement.getElementsByClassName(
          'scroll-content'
        )[0];
      }
    )));
  afterEach(() => {
    fixture.destroy();
  });
  it('should set scroll-content background-image to a linear gradient with specified color', () => {
    const backgroundImage =
      'linear-gradient(blue, blue 50%, rgb(245, 245, 245) 50%, rgb(245, 245, 245) 50%, rgb(245, 245, 245) 50%)';
    expect(scrollContent.style.backgroundImage).toBe(backgroundImage);
  });
  it('should remove background-image if none specified', () => {
    instance.color = null;
    fixture.detectChanges();
    expect(scrollContent.style.backgroundImage).toBe('');
  });
});
