import { DerivationPathHelperProvider } from './derivation-path-helper';

describe('Derivation Path Helper Provider', () => {
  let service: DerivationPathHelperProvider;

  beforeEach(() => {
    service = new DerivationPathHelperProvider();
  });

  /* default paths */
  it('should get successfully the default derivation paths for livenet and testnet networks', () => {
    const livenet = service.default;
    const testnet = service.defaultTestnet;

    expect(livenet).toBeDefined();
    expect(livenet).toEqual("m/44'/0'/0'");
    expect(testnet).toBeDefined();
    expect(testnet).toEqual("m/44'/1'/0'");
  });

  /* BIP44 */
  it('should parse successfully the livenet path for BIP44 derivation strategy', () => {
    const result = service.parse("m/44'/0'/0'");
    expect(result).toBeTruthy();
    if (result !== false) {
      expect(result.derivationStrategy).toEqual('BIP44');
      expect(result.networkName).toEqual('livenet');
      expect(result.account).toEqual(0);
    }
  });

  it('should parse successfully the testnet path for BIP44 derivation strategy', () => {
    const result = service.parse("m/44'/1'/0'");
    expect(result).toBeTruthy();
    if (result !== false) {
      expect(result.derivationStrategy).toEqual('BIP44');
      expect(result.networkName).toEqual('testnet');
      expect(result.account).toEqual(0);
    }
  });

  /* BIP45 */
  it('should parse successfully the livenet path for BIP45 derivation strategy', () => {
    const result = service.parse("m/45'/0'/0'");
    expect(result).toBeTruthy();
    if (result !== false) {
      expect(result.derivationStrategy).toEqual('BIP45');
      expect(result.networkName).toEqual('livenet');
      expect(result.account).toEqual(0);
    }
  });

  /* BIP48 */
  it('should parse successfully the livenet path for BIP48 derivation strategy', () => {
    const result = service.parse("m/48'/0'/0'");
    expect(result).toBeTruthy();
    if (result !== false) {
      expect(result.derivationStrategy).toEqual('BIP48');
      expect(result.networkName).toEqual('livenet');
      expect(result.account).toEqual(0);
    }
  });

  it('should parse successfully the testnet path for BIP48 derivation strategy', () => {
    const result = service.parse("m/48'/1'/0'");
    expect(result).toBeTruthy();
    if (result !== false) {
      expect(result.derivationStrategy).toEqual('BIP48');
      expect(result.networkName).toEqual('testnet');
      expect(result.account).toEqual(0);
    }
  });

  /* Unsupported paths */
  it('should fail trying to parse an unsupported derivation path', () => {
    let result = service.parse("p/145'/0'/0'");
    expect(result).toBe(false);

    result = service.parse("m/145'/0'/0'");
    expect(result).toBe(false);

    result = service.parse("m/44'/9'/0'");
    expect(result).toBe(false);

    result = service.parse("m/44'/0'/a'");
    expect(result).toBe(false);
  });
});
