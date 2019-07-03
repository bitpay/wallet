import { Animation, PageTransition } from 'ionic-angular';

/* ==================================================
Fade
================================================== */
export class ModalEnterFadeIn extends PageTransition {
  public init() {
    super.init();
    const ele: HTMLElement = this.enteringView.pageRef().nativeElement;
    const wrapper = new Animation(this.plt, ele.querySelector('.modal-wrapper'));
    const backdrop = new Animation(this.plt, ele.querySelector('ion-backdrop'));
    wrapper.fromTo('transform', 'scale3d(1, 1, 1)', 'scale3d(1, 1, 1)');
    wrapper.fromTo('opacity', 0, 1);
    backdrop.fromTo('opacity', 0.01, 0.4);
    this
      .element(this.enteringView.pageRef())
      .easing('ease-in')
      .duration(400)
      .add(backdrop)
      .add(wrapper);
  }
}

export class ModalLeaveFadeOut extends PageTransition {
  public init() {
    super.init();
    const ele: HTMLElement = this.leavingView.pageRef().nativeElement;
    const wrapper = new Animation(this.plt, ele.querySelector('.modal-wrapper'));
    const backdrop = new Animation(this.plt, ele.querySelector('ion-backdrop'));
    wrapper.fromTo('opacity', 1, 0);
    backdrop.fromTo('opacity', 0.4, 0.0);
    this
      .element(this.leavingView.pageRef())
      .easing('ease-out')
      .duration(250)
      .add(backdrop)
      .add(wrapper);
  }
}
