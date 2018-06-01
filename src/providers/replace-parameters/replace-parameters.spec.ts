import { ReplaceParametersProvider } from './replace-parameters';

describe('Replace Parameters Provider', () => {
  let service: ReplaceParametersProvider;
  let replacedString: string;

  beforeEach(() => {
    service = new ReplaceParametersProvider();
  });

  it('Should replace successfully parameters of the provided string, with no spaces between brackets', () => {
    replacedString = service.replace(
      'A total of {{amountBelowFeeStr}} {{coin}} were excluded. These funds come from UTXOs smaller than the network fee provided.',
      { amountBelowFeeStr: '0.000100', coin: 'BTC' }
    );
    expect(replacedString).toEqual(
      'A total of 0.000100 BTC were excluded. These funds come from UTXOs smaller than the network fee provided.'
    );
  });

  it('Should replace successfully parameters of the provided string, with spaces between brackets', () => {
    replacedString = service.replace(
      'A total of {{ amountBelowFeeStr }} {{ coin }} were excluded. These funds come from UTXOs smaller than the network fee provided.',
      { amountBelowFeeStr: '0.000100', coin: 'BTC' }
    );
    expect(replacedString).toEqual(
      'A total of 0.000100 BTC were excluded. These funds come from UTXOs smaller than the network fee provided.'
    );
  });

  it('Should replace successfully parameters of the provided string, with more than one parameter with the same name', () => {
    replacedString = service.replace(
      'Testing a string with several repeated {{ parameters }} {{ parameters }} {{ parameters }} {{ parameters }}.',
      { parameters: 'parameters' }
    );
    expect(replacedString).toEqual(
      'Testing a string with several repeated parameters parameters parameters parameters.'
    );
  });

  it('Should replace successfully parameters of the provided string, with more than one parameter with the same name not consecutive', () => {
    replacedString = service.replace(
      'Testing a string with several repeated {{ parameters }} {{ parameters }} {{ other }} {{ parameters }}.',
      { parameters: 'parameters', other: 'different' }
    );
    expect(replacedString).toEqual(
      'Testing a string with several repeated parameters parameters different parameters.'
    );
  });

  it('Should replace successfully parameters of the provided string, with parameters in different order', () => {
    replacedString = service.replace(
      'Parameter1: {{ parameter1 }} - Parameter2: {{ parameter2 }}',
      { parameter2: 'parameter2', parameter1: 'parameter1' }
    );
    expect(replacedString).toEqual(
      'Parameter1: parameter1 - Parameter2: parameter2'
    );
  });

  it('Should replace successfully parameters of the provided string, if a parameter is a number', () => {
    replacedString = service.replace(
      'Number replaced into this string: {{ number }}',
      { number: 1.0001 }
    );
    expect(replacedString).toEqual('Number replaced into this string: 1.0001');
  });

  it('Should return string without replacements if the spaces inside the brackets are not respected correctly', () => {
    replacedString = service.replace('Hello {{world }}. I love {{ appName }}', {
      world: 'world!',
      appName: 'Copay'
    });
    expect(replacedString).toEqual('Hello {{world }}. I love Copay');
  });
});
