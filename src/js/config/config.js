var DEFAULT_CONFIG = {
    networkName: 'ventas',
    coin: 'ven',
    bwsurl: 'http://localhost:3232/bws/api',
    showMoney: false,
    networks: ['livenet', 'ventas']
}
var COIN_CONFIG = {
    btc: {
        bwsurl: 'http://localhost:3232/bws/api',
        insight: 'http://localhost:3001/insight'
    },
    ltc: {
        bwsurl: 'http://localhost:3232/bws/api',
        insight: 'http://localhost:3001/insight'
    },
    ven: {
        bwsurl: 'http://localhost:3232/bws/api',
        insight: 'http://localhost:3001/insight'
    },
}