import {
  Component,
  ContentChild,
  ElementRef,
  Input,
  Renderer2
} from '@angular/core';
import { DomController, IonContent, Platform } from '@ionic/angular';
// import { Content } from 'ionic-angular';
@Component({
  selector: 'expandable-header-primary',
  template: '<ng-content></ng-content>',
  styleUrls: ['expandable-header.scss'],
})
export class ExpandableHeaderPrimaryComponent {
  constructor(public element: ElementRef) { }
}
@Component({
  selector: 'expandable-header-footer',
  template: '<ng-content></ng-content>',
  styleUrls: ['expandable-header.scss'],
})
export class ExpandableHeaderFooterComponent {
  constructor(public element: ElementRef) { }
}
@Component({
  selector: 'expandable-header',
  template: '<ng-content></ng-content>',
  styleUrls: ['expandable-header.scss'],
})
export class ExpandableHeaderComponent {
  @ContentChild(ExpandableHeaderPrimaryComponent)
  primaryContent: ExpandableHeaderPrimaryComponent;
  @ContentChild(ExpandableHeaderFooterComponent)
  footerContent: ExpandableHeaderFooterComponent;

  /**
   * The instance of ion-content to which the expandable header
   * will react based on user scrolling.
   */
  @Input('scrollArea')
  scrollArea: IonContent;

  /**
   * Determines how quickly the content fades out on scroll. The
   * greater the value, the quicker the fade.
   */
  @Input()
  fadeFactor: number = 2.5;

  @Input()
  disableFade: boolean = false;

  /**
   * The height of the entire component based on its' content.
   */
  headerHeight: number;

  constructor(public element: ElementRef, public renderer: Renderer2, public platform: Platform, private domCtrl: DomController) { }

  ngOnInit() {
    if (this.disableFade) return;
  }

  ngOnChanges() {
    this.scrollArea.ionScroll.subscribe((event: any) =>
      this.adjustElementOnScroll(event)
    );
  }

  private adjustElementOnScroll(ev) {
    if (ev) {
      this.domCtrl.write(() => {
        return this.handleDomWrite(ev.detail.scrollTop - 200)
      });
    }
  }

  ngAfterViewInit() {
    this.headerHeight = this.platform.is('ios') ? 44 : 56;
  }

  private handleDomWrite(scrollTop: number) {
    const newHeaderHeight = this.getNewHeaderHeight(scrollTop);
    newHeaderHeight > 0 && this.applyTransforms(scrollTop, newHeaderHeight);
  }

  private applyTransforms(scrollTop: number, newHeaderHeight: number): void {
    const transformations = this.computeTransformations(
      scrollTop,
      newHeaderHeight
    );
    this.transformContent(transformations);
  }

  private getNewHeaderHeight(scrollTop: number): number {
    const newHeaderHeight = this.headerHeight - scrollTop;
    return newHeaderHeight < 0 ? 0 : newHeaderHeight;
  }

  private computeTransformations(
    scrollTop: number,
    newHeaderHeight: number
  ): number[] {
    const opacity = this.getScaleValue(newHeaderHeight, this.fadeFactor);
    const scale = this.getScaleValue(newHeaderHeight, 0.5);
    const translateY = scrollTop > 0 ? scrollTop / 1.5 : 0;
    return [opacity, scale, translateY];
  }

  private getScaleValue(newHeaderHeight: number, exponent: number): number {
    return (
      Math.pow(newHeaderHeight, exponent) /
      Math.pow(this.headerHeight, exponent)
    );
  }

  private transformContent(transformations: number[]): void {
    const [opacity] = transformations;
    this.renderer.setStyle(
      this.primaryContent.element.nativeElement,
      'opacity',
      `${opacity}`
    );
    this.renderer.setStyle(
      this.footerContent.element.nativeElement,
      'opacity',
      `${opacity}`
    );
  }
}

export const EXPANDABLE_HEADER_COMPONENTS = [
  ExpandableHeaderComponent,
  ExpandableHeaderFooterComponent,
  ExpandableHeaderPrimaryComponent
];
