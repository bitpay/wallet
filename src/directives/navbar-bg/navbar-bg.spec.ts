import { Component, ElementRef } from '@angular/core';
import { async, ComponentFixture } from '@angular/core/testing';
import { TestUtils } from '../../test';
import { NavbarBg } from './navbar-bg';

let fixture: ComponentFixture<TestHostComponent>;
let instance;
let toolbarBg;

@Component({
  template: ` <ion-navbar [navbar-bg]="color"></ion-navbar> `
})
class TestHostComponent {
  color: string = 'blue';
  constructor(public element: ElementRef) {}
}

describe('NavbarBg', () => {
  beforeEach(async(() =>
    TestUtils.beforeEachCompiler([TestHostComponent, NavbarBg]).then(
      compiled => {
        fixture = compiled.fixture;
        instance = compiled.instance;
        fixture.detectChanges();
        toolbarBg = instance.element.nativeElement.getElementsByClassName(
          'toolbar-background'
        )[0];
      }
    )));
  afterEach(() => {
    fixture.destroy();
  });
  it('should set the navbar bg color to the specified color', () => {
    expect(toolbarBg.style.background).toBe('blue');
  });
  it('should remove the navbar bg color if none specified', () => {
    instance.color = null;
    fixture.detectChanges();
    expect(toolbarBg.style.background).toBe('');
  });
});
