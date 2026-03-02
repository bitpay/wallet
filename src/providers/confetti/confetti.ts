import { Injectable } from '@angular/core';

const defaultColors = ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a'];

@Injectable()
export class ConfettiProvider {
  constructor() {}

  createElements(root, elementCount, colors) {
    return Array.from({ length: elementCount }).map((_, index) => {
      const element = document.createElement('div');
      const color = colors[index % colors.length];
      element.style['background-color'] = color;
      element.style.width = '10px';
      element.style.height = '10px';
      element.style.position = 'absolute';
      element.style.zIndex = '1000';
      root.appendChild(element);
      return element;
    });
  }

  randomPhysics(angle, spread, startVelocity, random) {
    const radAngle = angle * (Math.PI / 180);
    const radSpread = spread * (Math.PI / 180);
    return {
      x: 0,
      y: 0,
      wobble: random() * 10,
      velocity: startVelocity * 0.5 + random() * startVelocity,
      angle2D: -radAngle + (0.5 * radSpread - random() * radSpread),
      angle3D: -(Math.PI / 4) + random() * (Math.PI / 2),
      tiltAngle: random() * Math.PI
    };
  }

  updateFetti(fetti, progress, decay) {
    fetti.physics.x += Math.cos(fetti.physics.angle2D) * fetti.physics.velocity;
    fetti.physics.y += Math.sin(fetti.physics.angle2D) * fetti.physics.velocity;
    fetti.physics.z += Math.sin(fetti.physics.angle3D) * fetti.physics.velocity;
    fetti.physics.wobble += 0.1;
    fetti.physics.velocity *= decay;
    fetti.physics.y += 3;
    fetti.physics.tiltAngle += 0.1;

    const { x, y, tiltAngle, wobble } = fetti.physics;
    const wobbleX = x + 10 * Math.cos(wobble);
    const wobbleY = y + 10 * Math.sin(wobble);
    const transform = `translate3d(${wobbleX}px, ${wobbleY}px, 0) rotate3d(1, 1, 1, ${tiltAngle}rad)`;

    fetti.element.style.transform = transform;
    fetti.element.style.opacity = 1 - progress;
  }

  animate(root, fettis, decay) {
    const totalTicks = 200;
    let tick = 0;

    const update = () => {
      fettis.forEach(fetti =>
        this.updateFetti(fetti, tick / totalTicks, decay)
      );

      tick += 1;
      if (tick < totalTicks) {
        requestAnimationFrame(update);
      } else {
        fettis.forEach(fetti => {
          if (fetti.element.parentNode === root) {
            return root.removeChild(fetti.element);
          }
        });
      }
    };

    requestAnimationFrame(update);
  }

  confetti(
    root,
    {
      angle = 90,
      decay = 0.9,
      spread = 45,
      startVelocity = 45,
      elementCount = 50,
      colors = defaultColors,
      random = Math.random
    } = {}
  ) {
    const elements = this.createElements(root, elementCount, colors);
    const fettis = elements.map(element => ({
      element,
      physics: this.randomPhysics(angle, spread, startVelocity, random)
    }));

    this.animate(root, fettis, decay);
  }
}
