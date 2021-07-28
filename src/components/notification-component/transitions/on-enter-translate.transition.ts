import { Animation, PageTransition } from 'ionic-angular';

export class ModalTranslateEnterTransition extends PageTransition {
  public init() {
    const ele = this.enteringView.pageRef().nativeElement;
    const wrapper = new Animation(
      this.plt,
      ele.querySelector('.modal-wrapper')
    );

    wrapper.beforeStyles({ transform: 'translateX(100%);', opacity: 1 });
    wrapper.fromTo('transform', 'translateY(-100%)', 'translateY(0)');
    wrapper.fromTo('opacity', 1, 1);

    this.element(this.enteringView.pageRef())
      .duration(500)
      .easing('cubic-bezier(.1, .7, .1, 1)')
      .add(wrapper);
  }
}
