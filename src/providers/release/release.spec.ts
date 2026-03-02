import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppProvider } from '../../providers/app/app';
import { Logger } from '../../providers/logger/logger';
import { ReleaseProvider } from './release';

describe('Release Provider', () => {
  let releaseProvider: ReleaseProvider;
  let logger: Logger;
  let httpMock: HttpTestingController;
  const currentAppVersion = 'v1.1.1';
  const latestAppVersion = 'v2.2.2';
  let loggerSpy;

  class AppProviderMock {
    public info;
    constructor() {
      this.info = { version: currentAppVersion };
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReleaseProvider,
        Logger,
        { provide: AppProvider, useClass: AppProviderMock }
      ]
    });
    releaseProvider = TestBed.get(ReleaseProvider);
    logger = TestBed.get(Logger);
    loggerSpy = spyOn(logger, 'error');
    httpMock = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get successfully the current app version', () => {
    const appVersion = releaseProvider.getCurrentAppVersion();

    expect(appVersion).toBeDefined();
    expect(appVersion).toEqual(currentAppVersion);
  });

  it('should get successfully the latest app version', () => {
    releaseProvider.getLatestAppVersion().then((data: { version: string }) => {
      const version = data.version;
      expect(version).toBeDefined();
      expect(version).toEqual(latestAppVersion);
    });

    const bwsReq = httpMock.expectOne(
      'https://bws.bitpay.com/bws/api/latest-version'
    );
    expect(bwsReq.request.method).toEqual('GET');
    bwsReq.flush({ version: latestAppVersion });
  });

  it('should check unsuccessfully the latest app version format', () => {
    const result = releaseProvider.newReleaseAvailable('V..3.3.3');
    expect(result).toBeFalsy;
    expect(loggerSpy).toHaveBeenCalledWith(
      'Cannot verify the format of version tag. latestVersion V..3.3.3 - currentVersion v1.1.1'
    );
  });

  it('should check unsuccessfully the current app version format', () => {
    spyOn(releaseProvider, 'getCurrentAppVersion').and.returnValue('V..1.1.1');
    const result = releaseProvider.newReleaseAvailable(latestAppVersion);
    expect(result).toBeFalsy;
    expect(loggerSpy).toHaveBeenCalledWith(
      'Cannot verify the format of version tag. latestVersion v2.2.2 - currentVersion V..1.1.1'
    );
  });

  it('should be a new version available', () => {
    const result = releaseProvider.newReleaseAvailable(latestAppVersion);
    expect(result).toBeTruthy;
  });

  it('should be a new major version available', () => {
    const majorAppVersion = '2.0.0';
    const result = releaseProvider.newReleaseAvailable(majorAppVersion);
    expect(result).toBeTruthy;
  });

  it('should be a new minor version available', () => {
    const minorAppVersion = '1.2.0';
    const result = releaseProvider.newReleaseAvailable(minorAppVersion);
    expect(result).toBeFalsy;
  });

  it('should be a new patch version available', () => {
    const patchAppVersion = '1.1.2';
    const result = releaseProvider.newReleaseAvailable(patchAppVersion);
    expect(result).toBeFalsy;
  });
});
