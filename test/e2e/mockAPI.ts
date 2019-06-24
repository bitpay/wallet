import * as express from 'express';
import { createReadStream } from 'fs';
import { port } from '../../src/environments/e2e';

const mock = startMockServer(port);

function sendJSON(filePath: string) {
  return (req: express.Request, res: express.Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    res.setHeader('Content-Type', 'application/json');
    createReadStream(`${__dirname}/${filePath}`).pipe(res);
  };
}

function startMockServer(port: number) {
  const mock = express();

  // Our mocked API calls:
  mock.get('/', (req, res) =>
    res.status(200).json({ message: 'E2E mock server is alive.' })
  );
  mock.get(
    '/bitpay.com/api/rates/',
    sendJSON('mocks/bitpay.com_api_rates.json')
  );
  mock.get(
    '/bitpay.com/api/rates/bch',
    sendJSON('mocks/bitpay.com_api_rates_bch.json')
  );

  mock.listen(port, () =>
    // tslint:disable-next-line:no-console
    console.log(`
      E2E mock API server is listening at: http://localhost:${port}/
      `)
  );
}
