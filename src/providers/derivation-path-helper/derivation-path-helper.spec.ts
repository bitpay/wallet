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
    const path = "m/44'/0'/0'";
    expect(service.getDerivationStrategy(path)).toEqual('BIP44');
    expect(service.getNetworkName(path)).toEqual('livenet');
    expect(service.getAccount(path)).toEqual(0);
  });

  it('should parse successfully the testnet path for BIP44 derivation strategy', () => {
    const path = "m/44'/1'/0'";
    expect(service.getDerivationStrategy(path)).toEqual('BIP44');
    expect(service.getNetworkName(path)).toEqual('testnet');
    expect(service.getAccount(path)).toEqual(0);
  });

  /* BIP45 */
  it('should parse successfully the livenet path for BIP45 derivation strategy', () => {
    const path = "m/45'/0'/0'";
    expect(service.getDerivationStrategy(path)).toEqual('BIP45');
    expect(service.getNetworkName(path)).toEqual('livenet');
    expect(service.getAccount(path)).toEqual(0);
  });

  /* BIP48 */
  it('should parse successfully the livenet path for BIP48 derivation strategy', () => {
    const path = "m/48'/0'/0'";
    expect(service.getDerivationStrategy(path)).toEqual('BIP48');
    expect(service.getNetworkName(path)).toEqual('livenet');
    expect(service.getAccount(path)).toEqual(0);
  });

  it('should parse successfully the testnet path for BIP48 derivation strategy', () => {
    const path = "m/48'/1'/0'";
    expect(service.getDerivationStrategy(path)).toEqual('BIP48');
    expect(service.getNetworkName(path)).toEqual('testnet');
    expect(service.getAccount(path)).toEqual(0);
  });

  /* Unsupported paths */
  it('should fail trying to parse an unsupported derivation path', () => {
    let path = "p/145'/0'/0'";
    expect(service.getDerivationStrategy(path)).toBeUndefined();

    path = "m/145'/0'/0'";
    expect(service.getDerivationStrategy(path)).toBeUndefined();

    path = "m/44'/9'/0'";
    expect(service.getNetworkName(path)).toBeUndefined();

    path = "m/44'/0'/a'";
    expect(service.getAccount(path)).toBeUndefined();
  });
});
