'use strict';

var PORT = 33334;

window.onerror = function(e) {
  document.write('Global ERROR: ' + e);
};

function App() {
  this.logContainer = document.getElementById('log');
  this.server = null;
  this.sockets = null;

  this.launchButton = document.getElementById('launch');
  this.launchButton.onclick = this.launchApp.bind(this);
}

App.prototype.log = function(msg) {
  var log = document.createElement('p');
  log.textContent = '[' + new Date().toUTCString() + ']' + msg;
  this.logContainer.insertBefore(log, this.logContainer.firstChild);
};

App.prototype.start = function() {
  this.createServer();
};

App.prototype.createServer = function() {
  try {
    this.server = navigator.mozTCPSocket.listen(PORT);
  } catch (e) {
    this.log('Failed to create server: ' + e);
  }
  this.log('Creating server, listening on ' + PORT);
  this.server.onconnect = this.handleConnect.bind(this);
  this.server.onerror = function(e) {
    this.log('Error creating server: ' + e);
  }.bind(this);
};

App.prototype.handleConnect = function(socket) {
  this.log('Got incoming connection!');
  this.socket = socket;
  this.socket.ondata = this.handleData.bind(this);
};

App.prototype.handleData = function(evt) {
  this.log('Got data: ' + evt);
};

App.prototype.getMessage = function(obj) {
  return JSON.stringify(obj) + '\n';
};

App.prototype.launchApp = function() {
  this.socket.send(JSON.stringify({
    'action': 'launch',
    'origin': 'app://email.gaiamobile.org'
  }) + '\n');
};

window.addEventListener('DOMContentLoaded', function() {
  window.app = new App();
  window.app.start();
});

