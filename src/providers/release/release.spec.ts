import { HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { async, inject, TestBed } from '@angular/core/testing';
import { AppProvider } from '../../providers/app/app';
import { ReleaseProvider } from './release';

describe('Release Provider', () => {
  let releaseService: ReleaseProvider;
  let httpMock: HttpTestingController;
  let currentAppVersion, latestAppVersion;

  class AppProviderMock {
    private info: any;
    constructor() {
      this.info = { version: '1.1.1' };
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
    currentAppVersion = '1.1.1';
    latestAppVersion = '2.2.2';
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get successfully the current app version', () => {
    // Should return the AppProviderMock object
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

  it('should check unsuccessfully the current app version format', () => {
    const result = releaseService.checkForUpdates(latestAppVersion, 'V..3.3.3');

    expect(result.updateAvailable).toBeNull;
    expect(result.availabeVersion).toBeNull;
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
    expect(result.availabeVersion).toBeNull;
    expect(result.error).toBeDefined();
    expect(result.error).toMatch('Cannot');
    expect(result.error).toMatch('release tag');
  });

  it('should compare the current and latest app version with the same value', () => {
    const result = releaseService.checkForUpdates('1.1.1', '1.1.1');

    expect(result.error).toBeNull;
    expect(result.updateAvailable).toBeNull;
    expect(result.availabeVersion).toBeNull;
  });

  it('should be a new version available', () => {
    const result = releaseService.checkForUpdates(
      latestAppVersion,
      currentAppVersion
    );

    expect(result.error).toBeNull;
    expect(result.updateAvailable).toBeTruthy;
    expect(result.availabeVersion).toEqual(latestAppVersion);
  });
});
