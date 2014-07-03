var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require('sdk/panel');
var self = require('sdk/self');

var panelScript = "window.addEventListener('click', function(event) {" +
               "  var t = event.target;" +
               "  if (t.nodeName == 'A')" +
               "    self.port.emit('click-link');" +
               "}, false);"

var button = ToggleButton({
  id: 'copay-addon',
  label: 'Copay',
  icon: {
    '16': './img/icons/icon-16.png',
    '32': './img/icons/icon-32.png',
    '64': './img/icons/icon-64.png'
  },
  onChange: handleChange
});

var panel = panels.Panel({
  contentURL: self.data.url('popup.html'),
  contentScript: panelScript,
  onHide: handleHide,
  height: 150
});

function handleChange(state) {
  if (state.checked) {
    panel.show({
      position: button
    });
  }
}

function handleHide() {
  button.state('window', {checked: false});
}

panel.port.on('click-link', function(url) {
  panel.hide();
});
