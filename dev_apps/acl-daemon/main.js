'use strict';

var PORT = 33334;

window.onerror = function(e) {
  document.write('Global ERROR: ' + e);
};

function $(el) {
  return document.getElementById(el);
}

function getRandomString() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '');
}

function App() {
  this.logContainer = document.getElementById('log');
  this.server = null;
  this.socket = null;
  this.buffer = '';
  this.notifications = [];

  $('launch').onclick = this.launchApp.bind(this);
  $('minimize').onclick = this.minimizeApp.bind(this);
  $('notify').onclick = this.sendNotification.bind(this);
  $('notify-remove').onclick = this.removeNotifications.bind(this);
  $('notify-silent').onclick = this.silentNotification.bind(this);
}

App.prototype.log = function(msg) {
  var log = document.createElement('p');
  log.textContent = msg;
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
  this.log('Connected to System App');
  this.socket = socket;
  this.socket.ondata = this.handleData.bind(this);
};

App.prototype.handleData = function(evt) {
  var data = evt.data;
  this.buffer += data;
  var i = this.buffer.indexOf('\n');
  while (i !== -1) {
    var msg = this.buffer.slice(0, i);
    this.buffer = this.buffer.slice(i + 1);
    this.handleMessage(msg);
    i = this.buffer.indexOf('\n');
  }
};

App.prototype.handleMessage = function(msg) {
  try {
    msg = JSON.parse(msg);
  } catch (e) {
    this.log('Unable to parse incoming msg ' + msg);
    return;
  }

  switch (msg.action) {
    case 'notify-click':
      this.log('Got click event');
      alert('Got click for: ' + msg.id);
      break;

    default:
      this.log('Unrecognized action: ' + msg.action);
  }
};

App.prototype.serializeMessage = function(obj) {
  return JSON.stringify(obj) + '\n';
};

App.prototype.launchApp = function() {
  if (!this.socket) {
    this.log('Cannot launch app, no connection');
    return;
  }
  this.log('Launching email');
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
  this.log('Sending notification');
  var id = getRandomString();
  this.notifications.push(id);
  var msg = this.serializeMessage({
    'id': id,
    'action': 'notify',
    'origin': 'app://email.gaiamobile.org',
    'title': 'This is a notification!',
    'body': (new Date()).toUTCString()
  });
  this.socket.send(msg);
};

App.prototype.removeNotifications = function() {
  if (!this.socket) {
    this.log('Cannot remove notificaiton, no connection');
  }
  this.log('Removing notification');
  var id = this.notifications.pop();
  var msg = this.serializeMessage({
    'id': id,
    'origin': 'app://email.gaiamobile.org',
    'action': 'notify-remove'
  });
  this.socket.send(msg);
};

App.prototype.silentNotification = function() {
  if (!this.socket) {
    this.log('Cannot send silent notification, no connection');
  }
  this.log('Sending silent notification');
  var id = getRandomString();
  this.notifications.push(id);
  var msg = this.serializeMessage({
    'id': id,
    'origin': 'app://email.gaiamobile.org',
    'action': 'notify',
    'title': 'SHHHHHHH!!!',
    'silent': true
  });
  this.socket.send(msg);
};

App.prototype.minimizeApp = function() {
  if (!this.socket) {
    this.log('Cannot minimize, no connection');
    return;
  }
  this.log('Minimizing current app');
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

