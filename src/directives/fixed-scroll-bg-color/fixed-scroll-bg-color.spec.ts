// import { Component, ElementRef } from '@angular/core';
// import { async, ComponentFixture } from '@angular/core/testing';
// import { TestUtils } from '../../test';
// import { FixedScrollBgColor } from './fixed-scroll-bg-color';

// let fixture: ComponentFixture<TestHostComponent>;
// let instance;
// let scrollContent;
// let fixedContent;
// let wrapperContent;

// @Component({
//   template: `
//     <ion-content [fixed-scroll-bg-color]="color"></ion-content>
//   `
// })
// class TestHostComponent {
//   color: string = 'blue';
//   constructor(public element: ElementRef) {}
// }

// describe('FixedScrollBgColor', () => {
//   beforeEach(async(() =>
//     TestUtils.beforeEachCompiler([TestHostComponent, FixedScrollBgColor]).then(
//       compiled => {
//         fixture = compiled.fixture;
//         instance = compiled.instance;
//         fixture.detectChanges();
//         scrollContent = instance.element.nativeElement.getElementsByClassName(
//           'scroll-content'
//         )[0];
//         fixedContent = instance.element.nativeElement.getElementsByClassName(
//           'fixed-content'
//         )[0];
//         wrapperContent = instance.element.nativeElement.getElementsByClassName(
//           'wrapper'
//         )[0];
//       }
//     )));
//   afterEach(() => {
//     fixture.destroy();
//   });
//   it('should set fixed-content and scroll-content background-image to a linear gradient with specified color', () => {
//     const backgroundImage =
//       'linear-gradient(blue, blue 50%, rgb(248, 248, 249) 50%, rgb(248, 248, 249) 50%, rgb(248, 248, 249) 50%)';
//     expect(fixedContent.style.backgroundImage).toBe(backgroundImage);
//     expect(scrollContent.style.backgroundImage).toBe(backgroundImage);
//     expect(wrapperContent).toBe(undefined);
//   });
//   it('should remove background-image if none specified', () => {
//     instance.color = null;
//     fixture.detectChanges();
//     expect(fixedContent.style.backgroundImage).toBe('');
//     expect(scrollContent.style.backgroundImage).toBe('');
//     expect(wrapperContent).toBe(undefined);
//   });
// });
