import { Directive, ElementRef, Input, Renderer } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

@Directive({
  selector: '[hide-header]', // Attribute selector
  host: {
    '(ionScroll)': 'onContentScroll($event)'
  }
})
export class HideHeaderDirective {

  @Input("header") header: HTMLElement;
  @Input("menu") menu: HTMLElement;
  @Input("balance") balance: HTMLElement;
  headerHeight;
  scrollContent;
  menuHeight;

  constructor(
    public element: ElementRef,
    public renderer: Renderer,
    private logger: Logger
  ) {
    this.logger.info('CopyToClipboardDirective initialized.');
  }

  ngOnInit() {
    this.headerHeight = this.header.clientHeight;
    this.menuHeight = this.menu.clientHeight;
    this.renderer.setElementStyle(this.header, 'webkitTransition', 'top 10ms');
    this.renderer.setElementStyle(this.menu, 'webkitTransition', 'top 10ms');
    this.renderer.setElementStyle(this.balance, 'webkitTransition', 'bottom 10ms');
    this.scrollContent = this.element.nativeElement.getElementsByClassName("scroll-content")[0];
    this.renderer.setElementStyle(this.scrollContent, 'webkitTransition', 'margin-top 10ms');
  }

  onContentScroll(event) {

    if (event.scrollTop < this.menuHeight - this.headerHeight * 2) {
      this.renderer.setElementStyle(this.menu, "top", "-" + event.scrollTop.valueOf() + "px");
    }
    else {
      let menuCollapseHeight = this.menuHeight - this.headerHeight * 2;
      this.renderer.setElementStyle(this.menu, "top", "-" + menuCollapseHeight.valueOf() + "px");
    }
  }

}