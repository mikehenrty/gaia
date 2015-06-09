'use strict';

(function(exports) {
  var HOST = '127.0.0.1';
  var PORT = 33334;
  var RETRY_TIMEOUT = 1000;

  function debug(msg) {
    dump('[ACL] ' +
      Array.prototype.slice.call(arguments).join(', ') + '\n');
  }

  var ACLManager = function() {
    this.socket = null;
    this.buffer = '';
  }

  ACLManager.prototype.debug = debug;

  ACLManager.prototype.start = function() {
    this.openConnection();
  };

  ACLManager.prototype.openConnection = function() {
    if (this.socket) {
      debug('Cannot connect, already have socket');
      return;
    }

    try {
      this.socket = navigator.mozTCPSocket.open(HOST, PORT);
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.ondata = this.handleData.bind(this);
      this.socket.onerror = this.handleSocketError.bind(this);
    } catch (e) {
      this.handleSocketError(e);
    }
  };

  ACLManager.prototype.handleSocketError = function(e) {
    debug('Error connecting: ' + JSON.stringify(e));
    this.socket = null;
    setTimeout(this.openConnection.bind(this), RETRY_TIMEOUT);
  };

  ACLManager.prototype.handleOpen = function(evt) {
    debug('CONNECTION OPEN ' + evt);
  };

  ACLManager.prototype.handleClose = function(evt) {
    debug('Closed connections: ' + evt.type);
  };

  ACLManager.prototype.handleData = function(evt) {
    var data = evt.data;
    this.buffer += data;
    var i = this.buffer.indexOf('\n');
    while (i !== -1) {
      var msg = this.buffer.slice(0, i);
      this.buffer = this.buffer.slice(i + 1);
      this.handleMessage(JSON.parse(msg));
      i = this.buffer.indexOf('\n');
    }
  };

  ACLManager.prototype.handleMessage = function(msg) {
    var action = msg.action;
    var origin = msg.origin;

    debug('processing message', action, origin);
    switch (action) {
      case 'launch':
        var app = applications.getByOrigin(origin);
        window.dispatchEvent(new CustomEvent('webapps-launch', {
          detail: {
            manifestURL: app.manifestURL,
            url: app.origin + app.manifest.launch_path,
            timestamp: Date.now()
          }
        }));
        break;

      case 'notify':
        var n = new Notification(msg.title, {
          body: msg.body
        });
        n.onclick = function() {
          // TODO: send message back
        };
        break;

      case 'minimize':
        // TODO: make sure msg.origin is the running app
        window.dispatchEvent(new CustomEvent('home'));
        break;

       default:
        debug('unrecognized action', action);
        break;
    }
  };

  exports.aclManager = new ACLManager();
  exports.aclManager.start();
}(window));
