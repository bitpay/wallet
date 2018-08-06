import {
  ApplicationRef,
  ComponentFactoryResolver,
  Injectable,
  Injector
} from '@angular/core';
import { DomProvider } from './dom';
@Injectable()
export class DomProviderMock extends DomProvider {
  constructor(
    componentFactoryResolver: ComponentFactoryResolver,
    injector: Injector,
    appRef: ApplicationRef
  ) {
    super(componentFactoryResolver, injector, appRef);
  }

  appendToDom() {}
}
