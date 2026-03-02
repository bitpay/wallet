import { Component, ViewChild } from '@angular/core';
import { async, ComponentFixture } from '@angular/core/testing';
import { Content, ScrollEvent } from 'ionic-angular';
import { TestUtils } from '../../test';
import {
  ExpandableHeaderComponent,
  ExpandableHeaderFooterComponent,
  ExpandableHeaderPrimaryComponent
} from './expandable-header';

import { Subject } from 'rxjs/Subject';

let fixture: ComponentFixture<TestHostComponent>;
let instance;
let contentMock;
let ionScrollSubject: Subject<ScrollEvent>;

const scrollEventMock = {
  domWrite: cb => {
    cb();
  },
  scrollTop: 0
};
@Component({
  template: `
    <expandable-header>
      <expandable-header-primary>primary content</expandable-header-primary>
      <expandable-header-footer>footer content</expandable-header-footer>
    </expandable-header>
  `
})
class TestHostComponent {
  @ViewChild(ExpandableHeaderComponent)
  expandableHeader: ExpandableHeaderComponent;
}

describe('ExpandableHeaderComponent', () => {
  beforeEach(async(() =>
    TestUtils.beforeEachCompiler([
      TestHostComponent,
      ExpandableHeaderComponent,
      ExpandableHeaderFooterComponent,
      ExpandableHeaderPrimaryComponent
    ]).then(compiled => {
      fixture = compiled.fixture;
      instance = compiled.instance.expandableHeader;
      instance.themeProvider = {
        getThemeInfo: () => {
          return 'light';
        }
      };
      ionScrollSubject = new Subject<ScrollEvent>();
      contentMock = {
        ionScroll: ionScrollSubject.asObservable()
      };
      instance.scrollArea = contentMock as Content;
    })));
  afterEach(() => {
    fixture.destroy();
  });
  describe('Initialization', () => {
    it('should subscribe to ionScroll', () => {
      const scrollSpy = spyOn(contentMock.ionScroll, 'subscribe');
      fixture.detectChanges();
      expect(instance).not.toBeNull();
      expect(scrollSpy).toHaveBeenCalled();
    });
    it('should store the initial content height', () => {
      fixture.detectChanges();
      expect(instance.headerHeight).toBeDefined();
    });
    it('should apply transforms on scroll events', () => {
      fixture.detectChanges();
      const scrollSpy = spyOn(instance, 'applyTransforms');
      ionScrollSubject.next(scrollEventMock as any);
      expect(scrollSpy).toHaveBeenCalledWith(
        scrollEventMock.scrollTop,
        instance.getNewHeaderHeight(scrollEventMock.scrollTop)
      );
    });
  });

  describe('Methods', () => {
    beforeEach(() => {
      instance.headerHeight = 100;
    });
    describe('#getNewHeaderHeight', () => {
      it('should subtract scrollTop value from headerHeight', () => {
        const newHeight = instance.getNewHeaderHeight(10);
        expect(newHeight).toBe(90);
      });
      it('should not allow negative values', () => {
        const newHeight = instance.getNewHeaderHeight(101);
        expect(newHeight).toBe(0);
      });
    });
    describe('#computeTransformations', () => {
      it('should not apply visible transforms if the user has not yet scrolled', () => {
        const transformations = instance.computeTransformations(
          0,
          instance.headerHeight
        );
        expect(transformations).toEqual([1, 1, 0]);
      });
      it('should completely hide content if the user has scrolled the full header height', () => {
        const transformations = instance.computeTransformations(100, 0);
        const [opacity, scale] = transformations;
        expect(opacity).toBe(0);
        expect(scale).toBe(0);
      });
    });
    describe('#applyTransforms', () => {
      it('should apply transforms to primary and footer content based on scroll position', () => {
        const transformSpy = spyOn(instance, 'transformContent');
        instance.applyTransforms(0, instance.headerHeight);
        expect(transformSpy).toHaveBeenCalledWith([1, 1, 0]);
      });
    });
  });
});
