import { Animation, PageTransition } from 'ionic-angular';

export class ModalTranslateLeaveTransition extends PageTransition {
  public init() {
    const ele = this.leavingView.pageRef().nativeElement;
    const wrapper = new Animation(
      this.plt,
      ele.querySelector('.modal-wrapper')
    );
    const contentWrapper = new Animation(
      this.plt,
      ele.querySelector('.wrapper')
    );

    wrapper.beforeStyles({ transform: 'translateX(100%)', opacity: 1 });
    wrapper.fromTo('transform', 'translateY(0)', 'translateY(-100%)');
    wrapper.fromTo('opacity', 1, 1);
    contentWrapper.fromTo('opacity', 1, 0);

    this.element(this.leavingView.pageRef())
      .duration(200)
      .easing('cubic-bezier(.1, .7, .1, 1)')
      .add(contentWrapper)
      .add(wrapper);
  }
}
