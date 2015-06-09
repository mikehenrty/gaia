'use strict';

var PORT = 33334;

window.onerror = function(e) {
  document.write('Global ERROR: ' + e);
};

function App() {
  this.logContainer = document.getElementById('log');
  this.server = null;
  this.socket = null;

  document.getElementById('launch').onclick = this.launchApp.bind(this);
  document.getElementById('notify').onclick = this.sendNotification.bind(this);
  document.getElementById('minimize').onclick = this.minimizeApp.bind(this);
}

App.prototype.log = function(msg) {
  var log = document.createElement('p');
  log.innerHTML = '[' + new Date().toUTCString() + ']<br />' + msg;
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

App.prototype.serializeMessage = function(obj) {
  return JSON.stringify(obj) + '\n';
};

App.prototype.launchApp = function() {
  if (!this.socket) {
    this.log('Cannot launch app, no connection');
    return;
  }
  var msg = this.serializeMessage({
    'action': 'launch',
    'origin': 'app://email.gaiamobile.org'
  });
  this.socket.send(msg);
};

App.prototype.sendNotification = function() {
  if (!this.socket) {
    this.log('Cannot send notification, no connection');
    return;
  }
  var msg = this.serializeMessage({
    'action': 'notify',
    'origin': 'app://email.gaiamobile.org',
    'title': 'This is a notification!',
    'body': 'yaaaaaaaaaay'
  });
  this.socket.send(msg);
};

App.prototype.minimizeApp = function() {
  if (!this.socket) {
    this.log('Cannot minimize, no connection');
    return;
  }
  var msg = this.serializeMessage({
    'action': 'minimize',
    'origin': 'app://acl-daemon.gaiamobile.org'
  });
  this.socket.send(msg);
};

window.addEventListener('DOMContentLoaded', function() {
  window.app = new App();
  window.app.start();
});

