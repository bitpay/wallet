var DEFAULT_CONFIG = {
    networkName: 'yangcoin',
    coin: 'yng',
    bwsurl: 'http://192.168.0.12:3232/bws/api',
    networks: ['livenet', 'ventas', 'litecoin', 'yangcoin']
}
var COIN_CONFIG = {
    btc: {
        bwsurl: 'https://192.168.0.12:3232/bws/api',
        insight: 'https://insight.bitpay.com',
        network: 'livenet',
        coin: 'btc',
        displayName: "BTC",
        coinName: "Bitcoin"
    },
    ltc: {
        bwsurl: 'http://192.168.0.12:3232/bws/api',
        insight: 'http://192.168.0.12:3001/insight',
        network: 'litecoin',
        coin: 'ltc',
        displayName: "LTC",
        coinName: "Litecoin"
    },
    ven: {
        bwsurl: 'http://192.168.0.12:3232/bws/api',
        insight: 'http://192.168.0.12:3001',
        network: 'ventas',
        coin: 'ven',
        displayName: "VEN",
        coinName: "VENTAS"
    },
    yng: {
        bwsurl: 'http://192.168.0.12:3232/bws/api',
        insight: 'http://192.168.0.12:23080',
        network: 'yangcoin',
        coin: 'yng',
        displayName: "YNG",
        coinName: "Yangcoin",
        showRate: false
    }
}