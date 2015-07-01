/* global dump, applications, AppWindowManager*/
'use strict';

(function(exports) {
  var DEBUG = true;
  var HOST = '127.0.0.1';
  var PORT = 33334;
  var RETRY_TIMEOUT = 1000;
  var POLL_TIMEOUT = 60000 * 5; // 5 minutes
  var SETTINGS_KEY = 'acl.enabled';
  var NOTIFICATION_PREFIX = 'ACL_NOTIFICATION';

  function debug() {
    DEBUG && dump('[ACL] ' +
      Array.prototype.slice.call(arguments).join(', ') + '\n');
  }

  function getRandomString() {
    return Math.random().toString(36).replace(/[^a-z]+/g, '');
  }

  var ACLManager = function() {
    this.pollStartedAt = null;
    this.socket = null;
    this.buffer = '';
    this.notifications = [];
  };

  ACLManager.prototype.start = function() {
    var req = navigator.mozSettings.createLock().get(SETTINGS_KEY);
    req.onsuccess = function() {
      if (req.result[SETTINGS_KEY] === true) {
        debug('starting ACL');
        this.attemptToConnect();
        navigator.mozApps.mgmt.addEventListener('install', function(evt) {
          var app = evt.application;
          if (app && app.manifest && app.manifest.permissions &&
              app.manifest.permissions['external-app']) {
            debug('app install, attempting to connect');
            this.attemptToConnect();
          }
        }.bind(this));
      } else {
        debug('ACL setting disabled');
      }
    }.bind(this);
    req.onerror = function(e) {
      debug('Unable to fecth acl settings', e);
    };
  };

  ACLManager.prototype.attemptToConnect = function() {
    debug('Starting acl connection attempt');
    this.pollStartedAt = Date.now();
    this.openConnection();
  };

  ACLManager.prototype.openConnection = function() {
    if (this.socket) {
      debug('Cannot connect, already have socket');
      return;
    }

    // Check for polling timeout.
    if (Date.now() - this.pollStartedAt > POLL_TIMEOUT) {
      debug('Poll timeout reached, giving up');
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
    this.socket = null;
    setTimeout(this.openConnection.bind(this), RETRY_TIMEOUT);
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

  ACLManager.prototype.serializeMessage = function(obj) {
    return JSON.stringify(obj) + '\n';
  };

  ACLManager.prototype.sendMessage = function(msg) {
    if (!this.socket) {
      debug('Cannot send message, no connection', msg);
    }
    this.socket.send(this.serializeMessage(msg));
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

  ACLManager.prototype.getAppIcon = function(app) {
    var smallestSize = null;
    for (var size in app.manifest.icons) {
      if (!smallestSize || size < smallestSize) {
        smallestSize = size;
      }
    }
    var iconURL = app.manifest.icons[smallestSize];
    if (iconURL.startsWith('/')) {
      iconURL = app.origin + iconURL;
    }
    return iconURL;
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
        this.launchApp(app);
        break;

      case 'minimize':
        // Only minimize requested app if it is active.
        if (AppWindowManager.getActiveApp().manifestURL === app.manifestURL) {
          this.minimizeApp(app);
        }
        break;

      case 'notify':
        this.sendNotification(app, msg);
        break;

      case 'notify-remove':
        this.removeNotification(msg.id);
        break;

       default:
        debug('unrecognized action', msg.action);
        break;
    }
  };

  ACLManager.prototype.launchApp = function(app) {
    window.dispatchEvent(new CustomEvent('webapps-launch', {
      detail: {
        manifestURL: app.manifestURL,
        url: app.origin + app.manifest.launch_path,
        timestamp: Date.now()
      }
    }));
  };

  ACLManager.prototype.minimizeApp = function(app) {
    window.dispatchEvent(new CustomEvent('home'));
  };

  ACLManager.prototype.sendNotification = function(app, detail) {
    if (!detail.id) {
      debug('No id received with notification, cannot fire click callback');
      detail.id = getRandomString() + Date.now();
    }

    if (!detail.icon) {
      detail.icon = this.getAppIcon(app);
    }

    if (detail.silent) {
      detail.icon += '#silent=1';
    }

    var n = new Notification(detail.title || '', {
      body: detail.body || '',
      icon: detail.icon,
      tag: NOTIFICATION_PREFIX + detail.id
    });

    n.onclick = function() {
      this.sendMessage({
        action: 'notify-click',
        id: detail.id,
        origin: detail.origin
      });
    }.bind(this);

    this.notifications[detail.id] = n;
  };

  ACLManager.prototype.removeNotification = function(id) {
    if (!id || !this.notifications[id]) {
      debug('Unable to find notification for removal', id);
    } else {
      this.notifications[id].close();
      delete this.notifications[id];
    }
  };

  exports.aclManager = new ACLManager();
  exports.aclManager.start();
}(window));
