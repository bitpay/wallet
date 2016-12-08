import { CopayApp } from './app.component';
import { NavMock, PlatformMock } from '../mocks';

let instance: CopayApp = null;

describe('CopayApp', () => {

  beforeEach(() => {
    instance = new CopayApp((<any> new PlatformMock));
    instance['nav'] = (<any>new NavMock());
  });

  it('initialises with an app', () => {
    expect(instance['app']).not.toBe(null);
  });

});
