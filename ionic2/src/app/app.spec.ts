import { CopayApp }                      from './app.component';
import { MenuMock, NavMock, PlatformMock } from '../mocks';
import { Page2 }                           from '../pages';

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
