import { TestBed, inject, async } from '@angular/core/testing';
import { Http } from '@angular/http';
import { AppProvider } from '../../providers/app/app';
import { ReleaseProvider } from './release';

describe('Release Provider', () => {
  let service: ReleaseProvider;
  let currentAppVersion, latestAppVersion;

  class AppProviderMock {
    private info: any;
    constructor() {
      this.info = { version: '1.1.1' };
    };
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ReleaseProvider, 
        { provide: Http },
        { provide: AppProvider, useClass: AppProviderMock },  
      ]
    });
  });

  beforeEach(inject([ReleaseProvider], (releaseService: ReleaseProvider) => {
    // Mocks
    service = releaseService;
    currentAppVersion = '1.1.1';
    latestAppVersion = '2.2.2';
  }));

  it('should get successfully the current app version', () => {
    // Should return the AppProviderMock object
    const appVersion = service.getCurrentAppVersion();
    
    expect(appVersion).toBeDefined();
    expect(appVersion).toEqual(currentAppVersion);
  });

  it('should get successfully the latest app version', async(() => {
    spyOn(service, 'getLatestAppVersion').and.returnValue(Promise.resolve(latestAppVersion));

    service.getLatestAppVersion()
      .catch((err) => expect(err).toBeNull)
      .then((version) => {
        expect(version).toBeDefined();
        expect(version).toEqual(latestAppVersion);
      });
  }));
    
  it('should check unsuccessfully the current app version format', () => {
    const result = service.checkForUpdates(latestAppVersion, 'V..3.3.3');
    
    expect(result.updateAvailable).toBeNull;
    expect(result.availabeVersion).toBeNull;
    expect(result.error).toBeDefined();
    expect(result.error).toMatch('Cannot');
    expect(result.error).toMatch('version tag');
  });
  
  it('should check unsuccessfully the latest app version format', () => {
    const result = service.checkForUpdates('V..3.3.3', currentAppVersion);
    
    expect(result.updateAvailable).toBeNull;
    expect(result.availabeVersion).toBeNull;
    expect(result.error).toBeDefined();
    expect(result.error).toMatch('Cannot');
    expect(result.error).toMatch('release tag');
  });

  it('should compare the current and latest app version with the same value', () => {
    const result = service.checkForUpdates('1.1.1', '1.1.1');

    expect(result.error).toBeNull;
    expect(result.updateAvailable).toBeNull;
    expect(result.availabeVersion).toBeNull;
  });
  
  it('should be a new version available', () => {
    const result = service.checkForUpdates(latestAppVersion, currentAppVersion);
    
    expect(result.error).toBeNull;
    expect(result.updateAvailable).toBeTruthy;
    expect(result.availabeVersion).toEqual(latestAppVersion);
  });
});
