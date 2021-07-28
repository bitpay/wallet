import { Animation, PageTransition } from 'ionic-angular';

export class ModalTranslateLeaveTransition extends PageTransition {
  public init() {
    const ele = this.leavingView.pageRef().nativeElement;
    const wrapper = new Animation(
      this.plt,
      ele.querySelector('.modal-wrapper')
    );

    wrapper.beforeStyles({ opacity: 1 });
    wrapper.fromTo('transform', 'translateY(-35%)', 'translateY(-100%)');
    wrapper.fromTo('opacity', 1, 0);

    this.element(this.leavingView.pageRef())
      .duration(700)
      .easing('cubic-bezier(.1, .7, .1, 1)')
      .add(wrapper);
  }
}
