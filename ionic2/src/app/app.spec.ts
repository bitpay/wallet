import { CopayApp }                      from './app.component';
import { NavMock, PlatformMock } from '../mocks';
import { IncomingDataService } from '../../services/incoming-data.service';

let instance: CopayApp = null;

describe('CopayApp', () => {

  beforeEach(() => {
    instance = new CopayApp(new IncomingDataService(), (<any> new PlatformMock));
    instance['nav'] = (<any>new NavMock());
  });

  it('initialises with an app', () => {
    expect(instance['app']).not.toBe(null);
  });

});
