import { LatestReleaseProviderStub } from '../../mocks/latestRelease'

describe('Latest Release Provider', () => {
  var currentVersion: string;
  var latestVersion: string;

  beforeEach(() => {
    // Using the mock => 3.3.3
    latestVersion = LatestReleaseProviderStub.checkLatestRelease(null, null);
  });

  it('should check successfully the latest release of the app', () => {
    expect(latestVersion).toBeDefined();
  });

  it('should check unsuccessfully the current release format of the app', () => {
    const result = LatestReleaseProviderStub.checkLatestRelease('V.3.3.3', '3.3.3');
    expect(result).toMatch('Cannot');
    expect(result).toMatch('version tag');
  });

  it('should check unsuccessfully the latest release format of the app', () => {
    const result = LatestReleaseProviderStub.checkLatestRelease('3.3.3', 'V.3.3.3');
    expect(result).toMatch('Cannot');
    expect(result).toMatch('release tag');
  });

  it('should compare the current and latest version of the app with the same value', () => {
    currentVersion = '3.3.3';
    const result = LatestReleaseProviderStub.checkLatestRelease(currentVersion, latestVersion);
    expect(result).toBeFalsy();
  });

  it('there should be a new version available', () => {
    currentVersion = '3.2.3';
    const result = LatestReleaseProviderStub.checkLatestRelease(currentVersion, latestVersion);
    expect(result).toBeTruthy();
  });

  it('there should not be a new version available', () => {
    currentVersion = '3.3.2';
    const result = LatestReleaseProviderStub.checkLatestRelease(currentVersion, latestVersion);
    expect(result).toBeFalsy();
  });
});
