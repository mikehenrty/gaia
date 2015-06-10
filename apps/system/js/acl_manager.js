/* global dump, applications*/
'use strict';

(function(exports) {
  var HOST = '127.0.0.1';
  var PORT = 33334;
  var RETRY_TIMEOUT = 1000;
  var SETTINGS_KEY = 'acl.enabled';

  function debug(msg) {
    dump('[ACL] ' +
      Array.prototype.slice.call(arguments).join(', ') + '\n');
  }

  var ACLManager = function() {
    this.socket = null;
    this.buffer = '';
  };

  ACLManager.prototype.debug = debug;

  ACLManager.prototype.start = function() {
    var req = navigator.mozSettings.createLock().get(SETTINGS_KEY);
    req.onsuccess = function() {
      if (req.result[SETTINGS_KEY] === true) {
        debug('starting ACL');
        this.openConnection();
      } else {
        debug('ACL setting disabled');
      }
    }.bind(this);
    req.onerror = function(e) {
      debug('Unable to fecth acl settings', e);
    };
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
      this.handleMessage(msg);
      i = this.buffer.indexOf('\n');
    }
  };

  ACLManager.prototype.getAppFromMessage = function(msg) {
    var app = null;
    if (msg.manifestURL) {
      app = applications.getByManifestURL(msg.manifestURL);
    }
    if (!app && msg.origin) {
      app = applications.getByOrigin(msg.origin);
    }
    if (!app) {
      debug('Unable to fetch app from message');
    }
    return app;
  };


  ACLManager.prototype.handleMessage = function(msg) {
    debug('processing message', msg);

    try {
      msg = JSON.parse(msg);
    } catch (e) {
      console.log('ACL: Unable to deserialize message');
      return;
    }

    var app = this.getAppFromMessage(msg);
    if (!app) {
      console.log('ACL: Unable to fetch app from message');
      return;
    }

    switch (msg.action) {
      case 'launch':
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
        debug('unrecognized action', msg.action);
        break;
    }
  };

  exports.aclManager = new ACLManager();
  exports.aclManager.start();
}(window));
