// This file is required by karma.conf.js and loads recursively all the .spec and framework files

// tslint:disable:ordered-imports
import 'zone.js/dist/long-stack-trace-zone';
import 'zone.js/dist/proxy.js';
import 'zone.js/dist/sync-test';
import 'zone.js/dist/jasmine-patch';
import 'zone.js/dist/async-test';
import 'zone.js/dist/fake-async-test';
// tslint:enable:ordered-imports

import { getTestBed, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  App,
  Config,
  DeepLinker,
  DomController,
  Form,
  IonicModule,
  Keyboard,
  MenuController,
  NavController,
  Platform
} from 'ionic-angular';
import { ConfigMock, PlatformMock } from 'ionic-mocks';

declare const require: any;

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
// Then we find all the tests.
const context: any = require.context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);

export class TestUtils {
  public static beforeEachCompiler(
    components: any[]
  ): Promise<{ fixture: any; instance: any }> {
    return TestUtils.configureIonicTestingModule(components)
      .compileComponents()
      .then(() => {
        const fixture: any = TestBed.createComponent(components[0]);
        return {
          fixture,
          instance: fixture.debugElement.componentInstance
        };
      });
  }

  public static configureIonicTestingModule(components: any[]): typeof TestBed {
    return TestBed.configureTestingModule({
      declarations: [...components],
      imports: [FormsModule, IonicModule, ReactiveFormsModule, TranslateModule],
      providers: [
        App,
        Form,
        Keyboard,
        DomController,
        MenuController,
        NavController,
        { provide: Platform, useFactory: () => PlatformMock.instance() },
        { provide: Config, useFactory: () => ConfigMock.instance() },
        { provide: DeepLinker, useFactory: () => ConfigMock.instance() }
      ]
    });
  }

  // http://stackoverflow.com/questions/2705583/how-to-simulate-a-click-with-javascript
  public static eventFire(el: any, etype: string): void {
    if (el.fireEvent) {
      el.fireEvent('on' + etype);
    } else {
      const evObj: any = document.createEvent('Events');
      evObj.initEvent(etype, true, false);
      el.dispatchEvent(evObj);
    }
  }
}
