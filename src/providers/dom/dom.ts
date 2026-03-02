import {
  ApplicationRef,
  ComponentFactoryResolver,
  ComponentRef,
  EmbeddedViewRef,
  Injectable,
  Injector
} from '@angular/core';
@Injectable()
export class DomProvider {
  constructor(
    protected componentFactoryResolver: ComponentFactoryResolver,
    protected injector: Injector,
    protected appRef: ApplicationRef
  ) {}

  public appendComponentToBody<T>(component: {
    new (...args): T;
  }): ComponentRef<T> {
    const componentRef = this.componentFactoryResolver
      .resolveComponentFactory<T>(component)
      .create(this.injector);
    this.appRef.attachView(componentRef.hostView);
    const domElem = (componentRef.hostView as EmbeddedViewRef<T>)
      .rootNodes[0] as HTMLElement;
    this.appendToDom(domElem);
    return componentRef;
  }

  protected appendToDom(domElem: HTMLElement) {
    document.getElementsByTagName('ion-app')[0].appendChild(domElem);
  }

  public removeComponent<T>(componentRef: ComponentRef<T>) {
    this.appRef.detachView(componentRef.hostView);
    componentRef.destroy();
  }
}
