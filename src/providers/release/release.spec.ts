import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppProvider } from '../../providers/app/app';
import { ReleaseProvider } from './release';

describe('Release Provider', () => {
  let releaseService: ReleaseProvider;
  let httpMock: HttpTestingController;
  const currentAppVersion = '1.1.1';
  const latestAppVersion = '2.2.2';

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
        { provide: AppProvider, useClass: AppProviderMock }
      ]
    });
    releaseService = TestBed.get(ReleaseProvider);
    httpMock = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get successfully the current app version', () => {
    const appVersion = releaseService.getCurrentAppVersion();

    expect(appVersion).toBeDefined();
    expect(appVersion).toEqual(currentAppVersion);
  });

  it('should get successfully the latest app version', () => {
    releaseService.getLatestAppVersion().subscribe(version => {
      expect(version).toBeDefined();
      expect(version).toEqual(latestAppVersion);
    });

    const githubReq = httpMock.expectOne(
      'https://api.github.com/repos/bitpay/copay/releases/latest'
    );
    expect(githubReq.request.method).toEqual('GET');
    githubReq.flush({ tag_name: latestAppVersion });
  });

  it('should use appVersion when no currentVersion is supplied', () => {
    let result = releaseService.checkForUpdates(latestAppVersion);

    expect(result.updateAvailable).toBeNull;
    expect(result.availableVersion).toBeNull;
    expect(result.error).toBeNull;
  });

  it('should check unsuccessfully the current app version format', () => {
    const result = releaseService.checkForUpdates(latestAppVersion, 'V..3.3.3');

    expect(result.updateAvailable).toBeNull;
    expect(result.availableVersion).toBeNull;
    expect(result.error).toBeDefined();
    expect(result.error).toMatch('Cannot');
    expect(result.error).toMatch('version tag');
  });

  it('should check unsuccessfully the latest app version format', () => {
    const result = releaseService.checkForUpdates(
      'V..3.3.3',
      currentAppVersion
    );

    expect(result.updateAvailable).toBeNull;
    expect(result.availableVersion).toBeNull;
    expect(result.error).toBeDefined();
    expect(result.error).toMatch('Cannot');
    expect(result.error).toMatch('release tag');
  });

  it('should compare the current and latest app version with the same value', () => {
    const result = releaseService.checkForUpdates('1.1.1', '1.1.1');

    expect(result.error).toBeNull;
    expect(result.updateAvailable).toBeNull;
    expect(result.availableVersion).toBeNull;
  });

  it('should be a new version available', () => {
    const result = releaseService.checkForUpdates(
      latestAppVersion,
      currentAppVersion
    );

    expect(result.error).toBeNull;
    expect(result.updateAvailable).toBeTruthy;
    expect(result.availableVersion).toEqual(latestAppVersion);
  });
  it('should be a new major version available', () => {
    const majorAppVersion = '2.0.0';
    const result = releaseService.checkForUpdates(
      majorAppVersion,
      currentAppVersion
    );

    expect(result.error).toBeNull;
    expect(result.updateAvailable).toBeTruthy;
    expect(result.availableVersion).toBe(majorAppVersion);
  });
  it('should be a new minor version available', () => {
    const minorAppVersion = '1.2.0';
    const result = releaseService.checkForUpdates(
      minorAppVersion,
      currentAppVersion
    );

    expect(result.error).toBeNull;
    expect(result.updateAvailable).toBeTruthy;
    expect(result.availableVersion).toBe(minorAppVersion);
  });
  it('should be a new patch version available', () => {
    const patchAppVersion = '1.1.2';
    const result = releaseService.checkForUpdates(
      patchAppVersion,
      currentAppVersion
    );

    expect(result.error).toBeNull;
    expect(result.updateAvailable).toBeTruthy;
    expect(result.availableVersion).toBe(patchAppVersion);
  });
});
