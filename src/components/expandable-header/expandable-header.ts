import {
  Component,
  ContentChild,
  ElementRef,
  Input,
  Renderer
} from '@angular/core';
import { Content } from 'ionic-angular';
@Component({
  selector: 'expandable-header-primary',
  template: '<ng-content></ng-content>'
})
export class ExpandableHeaderPrimaryComponent {
  constructor(public element: ElementRef) {}
}
@Component({
  selector: 'expandable-header-footer',
  template: '<ng-content></ng-content>'
})
export class ExpandableHeaderFooterComponent {
  constructor(public element: ElementRef) {}
}
@Component({
  selector: 'expandable-header',
  template: '<ng-content></ng-content>'
})
export class ExpandableHeaderComponent {
  @ContentChild(ExpandableHeaderPrimaryComponent)
  primaryContent: ExpandableHeaderPrimaryComponent;
  @ContentChild(ExpandableHeaderFooterComponent)
  footerContent: ExpandableHeaderFooterComponent;

  @Input('scrollArea') scrollArea: Content;

  headerHeight: number;
  setTransformTo2dTimeout: NodeJS.Timer;

  constructor(public element: ElementRef, public renderer: Renderer) {}

  ngOnInit() {
    this.scrollArea.ionScroll.subscribe(event => {
      event.domWrite(() => {
        this.applyTransforms(event.scrollTop);
      });
    });
  }

  ngAfterViewInit() {
    this.headerHeight = this.element.nativeElement.offsetHeight;
  }

  applyTransforms(scrollTop: number): void {
    clearTimeout(this.setTransformTo2dTimeout);

    const transformations = this.computeTransformations(scrollTop);
    this.transformPrimaryContent(transformations, true);
    this.transformFooterContent(transformations);

    this.setTransformTo2dTimeout = setTimeout(() => {
      // Using 3d transforms allows us to achieve great performance. However, on iOS devices, switching to a
      // different app and then returning back to this app causes any 3d transformed elements to dissapear
      // initially for some reason. Scrolling again causes them to reappear. However, we can ensure the
      // elements remain visible at all times by switching to 2d transforms once the user stops scrolling.
      this.transformPrimaryContent(transformations, false);
    }, 1000);
  }

  getNewHeaderHeight(scrollTop: number): number {
    const newHeaderHeight = this.headerHeight - scrollTop;
    return newHeaderHeight < 0 ? 0 : newHeaderHeight;
  }

  computeTransformations(scrollTop: number): number[] {
    const newHeaderHeight = this.getNewHeaderHeight(scrollTop);
    const opacity = this.getScaleValue(newHeaderHeight, 2.5);
    const scale = this.getScaleValue(newHeaderHeight, 0.5);
    const translateY = scrollTop > 0 ? scrollTop / 1.5 : 0;
    return [opacity, scale, translateY];
  }

  getScaleValue(newHeaderHeight: number, exponent: number): number {
    return (
      Math.pow(newHeaderHeight, exponent) /
      Math.pow(this.headerHeight, exponent)
    );
  }

  transformPrimaryContent(transformations: number[], is3d: boolean): void {
    const [opacity, scale, translateY] = transformations;
    const transform3d = `scale3d(${scale}, ${scale}, ${scale}) translateY(${translateY}px)`;
    const transform2d = `scale(${scale}, ${scale}) translate(0, ${translateY}px)`;
    const transformStr = is3d ? transform3d : transform2d;
    this.renderer.setElementStyle(
      this.primaryContent.element.nativeElement,
      'opacity',
      `${opacity}`
    );
    this.primaryContent &&
      this.renderer.setElementStyle(
        this.primaryContent.element.nativeElement,
        'transform',
        transformStr
      );
  }

  transformFooterContent(transformations: number[]): void {
    const [opacity] = transformations;
    this.footerContent &&
      this.renderer.setElementStyle(
        this.footerContent.element.nativeElement,
        'opacity',
        `${opacity}`
      );
  }
}
