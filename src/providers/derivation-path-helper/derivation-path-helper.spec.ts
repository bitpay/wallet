import { DerivationPathHelperProvider } from './derivation-path-helper';

describe('Derivation Path Helper Provider', () => {
  let service: DerivationPathHelperProvider;

  beforeEach(() => {
    service = new DerivationPathHelperProvider();
  });

  /* default paths */
  it('should get successfully the default derivation paths for livenet and testnet networks', () => {
    const livenetBTC = service.defaultBTC;
    const livenetBCH = service.defaultBCH;
    const testnet = service.defaultTestnet;

    expect(livenetBTC).toBeDefined();
    expect(livenetBTC).toEqual("m/44'/0'/0'");
    expect(livenetBCH).toBeDefined();
    expect(livenetBCH).toEqual("m/44'/145'/0'");
    expect(testnet).toBeDefined();
    expect(testnet).toEqual("m/44'/1'/0'");
  });

  /* BIP44 */
  it('should parse successfully the BTC livenet path for BIP44 derivation strategy', () => {
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
  it('should parse successfully the BTC livenet path for BIP45 derivation strategy', () => {
    const path = "m/45'";
    expect(service.getDerivationStrategy(path)).toEqual('BIP45');
    expect(service.getNetworkName(path)).toEqual('livenet');
    expect(service.getAccount(path)).toEqual(0);
  });

  /* BIP48 */
  it('should parse successfully the BTC livenet path for BIP48 derivation strategy', () => {
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

  /*  isValidDerivationPathCoin */
  it('should fail trying to parse an unsupported derivation path BTC', () => {
    expect(service.isValidDerivationPathCoin("m/45'", 'btc')).toEqual(true);
    expect(service.isValidDerivationPathCoin("m/44'/0'/0'", 'btc')).toEqual(
      true
    );
    expect(service.isValidDerivationPathCoin("m/44'/0'/1'", 'btc')).toEqual(
      true
    );

    expect(service.isValidDerivationPathCoin("m/48'/145'/0'", 'btc')).toEqual(
      false
    );

    expect(service.isValidDerivationPathCoin("m/48'/145'/10'", 'btc')).toEqual(
      false
    );
    expect(service.isValidDerivationPathCoin("m/44'/14'/0'", 'btc')).toEqual(
      false
    );
  });

  it('should fail trying to parse an unsupported derivation path BCH', () => {
    expect(service.isValidDerivationPathCoin("m/45'", 'bch')).toEqual(true);

    expect(service.isValidDerivationPathCoin("m/44'/145'/0'", 'bch')).toEqual(
      true
    );
    expect(service.isValidDerivationPathCoin("m/44'/145'/10'", 'bch')).toEqual(
      true
    );
  });
});
