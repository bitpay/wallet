const registerProtocolHandlers = function(app){
  app.setAsDefaultProtocolClient('bitpay')
  app.setAsDefaultProtocolClient('bitcoin')
  app.setAsDefaultProtocolClient('copay')
  app.setAsDefaultProtocolClient('bitauth')
}

module.exports = registerProtocolHandlers;
