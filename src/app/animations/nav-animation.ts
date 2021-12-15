import { Animation, AnimationController } from '@ionic/angular';
export const enterAnimation = (baseEl: HTMLElement, otps?: any): Animation => {
    const DURATION = 200;
    const DURATIONOUT = 200;
    const animationCtrl = new AnimationController();
    if (otps.mode == 'ios') {
        if (otps.direction == 'forward') {
            return animationCtrl.create()
                .addElement(otps.enteringEl)
                .duration(DURATION)
                .easing('ease-in')
                .fromTo('transform', 'translateX(100%)', 'translateX(0)')
                .fromTo('opacity', 0.25, 1);
        } else {
            const rootAnimation = animationCtrl.create()
                .addElement(otps.enteringEl)
                .duration(DURATION)
                .easing('ease-in')
                .fromTo('transform', 'translateX(-100%)', 'translateX(0)')
                .fromTo('opacity', 0.8, 1);
    
            const leavingAnimation = animationCtrl.create()
                .addElement(otps.leavingEl)
                .duration(DURATIONOUT)
                .easing('ease-out')
                .fromTo('transform', 'translateX(0)', 'translateX(100%)')
                .fromTo('opacity', 0.7, 0.25);
            return animationCtrl.create().addAnimation([rootAnimation, leavingAnimation])
        }
    } else {
        if (otps.direction == 'forward') {
            return animationCtrl.create()
                .addElement(otps.enteringEl)
                .duration(DURATION)
                .easing('ease-in')
                .fromTo('transform', 'translateY(5%)', 'translateY(0)')
                .fromTo('opacity', 0.25, 1);
        } else {
            const rootAnimation = animationCtrl.create()
                .addElement(otps.enteringEl)
                .duration(DURATION)
                .easing('ease-in')
                // .fromTo('transform', 'translateY(-100%)', 'translateY(0)')
                .fromTo('opacity', 0.8, 1);
    
            const leavingAnimation = animationCtrl.create()
                .addElement(otps.leavingEl)
                .duration(DURATIONOUT)
                .easing('ease-out')
                .fromTo('transform', 'translateY(0)', 'translateY(5%)')
                .fromTo('opacity', 0.7, 0.25);
            return animationCtrl.create().addAnimation([rootAnimation, leavingAnimation])
        }
    }
}