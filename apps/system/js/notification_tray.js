/*global NotificationTray: true */

'use strict';

var NotificationTray = {
  sliding: false,
  shown: false,

  minimumY: 10, // when sliding, do not display less than 50px
  yThreshold: 0.25, // open tray after sliding 20%

  screen: document.getElementById('screen'),
  swipeTarget: document.getElementById('bottom-panel'),
  container: document.getElementById('notification-tray'),
  topBar: document.getElementById('notification-bar'),
  clearAllButton: document.getElementById('notification-clear'),

  init: function() {
    this.swipeTarget.addEventListener('touchstart', this);
    this.swipeTarget.addEventListener('touchmove', this);
    this.swipeTarget.addEventListener('touchend', this);
    this.topBar.addEventListener('touchstart', this);
    this.topBar.addEventListener('touchmove', this);
    this.topBar.addEventListener('touchend', this);

    this.clearAllButton.addEventListener('click', this.clearAll.bind(this));
    window.addEventListener('appforeground', this.handleAppopen.bind(this));
  },

  handleEvent: function(evt) {
    switch (evt.type) {
      case 'touchstart':
        this.startSlide(evt.touches[0].pageY);
        break;

      case 'touchmove':
        this.slideToY(evt.touches[0].pageY);
        break;

      case 'touchend':
        this.endSlide(evt.touches[0].pageY);
        break;
    }
  },

  clearAll: function() {
    while (this.container.firstElementChild) {
      this.closeNotification(this.container.firstElementChild);
    }
  },

  add: function(detail) {
    var icon;
    var notificationNode = document.createElement('div');
    notificationNode.className = 'notification';

    notificationNode.dataset.notificationId = detail.id;
    notificationNode.dataset.obsoleteAPI = 'false';
    if (typeof detail.id === 'string' &&
        detail.id.indexOf('app-notif-') === 0) {
      notificationNode.dataset.obsoleteAPI = 'true';
    }
    var type = notificationNode.dataset.type = detail.type ||
                                              'desktop-notification';
    notificationNode.dataset.manifestURL = detail.manifestURL || '';

    if (detail.icon) {
      icon = document.createElement('img');
      icon.src = detail.icon;
      notificationNode.appendChild(icon);
    }

    var time = document.createElement('span');
    var timestamp = new Date();
    time.classList.add('timestamp');
    time.dataset.timestamp = timestamp;
    time.textContent = NotificationScreen.prettyDate(timestamp);
    notificationNode.appendChild(time);

    var dir = (detail.bidi === 'ltr' ||
               detail.bidi === 'rtl') ?
          detail.bidi : 'auto';
    notificationNode.dir = dir;

    var title = document.createElement('div');
    title.classList.add('title');
    title.textContent = detail.title;
    notificationNode.appendChild(title);
    title.lang = detail.lang;
    title.dir = dir;

    var message = document.createElement('div');
    message.classList.add('detail');
    message.textContent = detail.text;
    notificationNode.appendChild(message);
    message.lang = detail.lang;
    message.dir = dir;

    var notifSelector = '[data-notification-id="' + detail.id + '"]';
    var oldNotif = this.container.querySelector(notifSelector);
    if (oldNotif) {
      // The whole node cannot be replaced because CSS animations are re-started
      oldNotif.replaceChild(title, oldNotif.querySelector('.title'));
      oldNotif.replaceChild(message, oldNotif.querySelector('.detail'));
      oldNotif.replaceChild(time, oldNotif.querySelector('.timestamp'));
      var oldIcon = oldNotif.querySelector('img');
      if (icon) {
        oldIcon ? oldIcon.src = icon.src : oldNotif.insertBefore(icon,
                                                           oldNotif.firstChild);
      } else if (oldIcon) {
        oldNotif.removeChild(oldIcon);
      }
      oldNotif.dataset.type = type;
      notificationNode = oldNotif;
    } else {
      this.container.insertBefore(notificationNode, this.topBar.nextSibling);
    }

    this.clearAllButton.disabled = false;

    return notificationNode;
  },

  remove: function(notificationId) {
    var notifSelector = '[data-notification-id="' + notificationId + '"]';
    var notificationNode = this.container.querySelector(notifSelector);
    if (notificationNode) {
      notificationNode.parentNode.removeChild(notificationNode);
    }
    // if this is the only notification left
    if (!this.container.firstElementChild) {
      // no notifications left
      this.clearAllButton.disabled = true;
    }
  },

  startSlide: function(y) {
    this.screenHeight = this.screen.getBoundingClientRect().height;
    this.containerHeight = this.container.getBoundingClientRect().height;
    this.sliding = true;
    this.startY = y;
    this.slideToY(y);
  },

  slideToY: function(y) {
    if (!this.sliding) {
      return;
    }
    if (y < 0) {
      y = 0;
    }
    var yFromBottom = this.screenHeight - y;
    if (yFromBottom < this.minimumY) {
      this.container.classList.remove('no-transition');
      this.container.style.transform = 'translateY(-' + this.minimumY + 'px)';
    } else {
      this.container.classList.add('no-transition');
      this.container.style.transform = 'translateY(-' + yFromBottom + 'px)';
    }
  },

  endSlide: function(y) {
    this.sliding = false;
    var pixelsFromStart;
    // decide if we have slid enough pixels
    // to toggle the notification tray
    if (this.shown) {
      pixelsFromStart = y;
    } else {
      pixelsFromStart = this.screenHeight - y;
    }
    if (pixelsFromStart / this.screenHeight > this.yThreshold) {
      this.toggle();
    } else {
      this.cancelSlide();
    }
  },

  cancelSlide: function() {
    if (this.shown) {
      this.show();
    } else {
      this.hide();
    }
  },

  toggle: function() {
    if (this.shown) {
      this.hide();
    } else {
      this.show();
    }
  },

  show: function() {
    this.shown = true;
    this.container.classList.remove('no-transition');
    this.container.style.transform = 'translateY(-100%)';
  },

  hide: function() {
    this.shown = false;
    this.container.classList.remove('no-transition');
    this.container.style.transform = 'translateY(0)';
  },

  startNotificationSlide: function(el, x) {

  },

  slideNotificationToX: function(el, x) {

  },


  endNotificationSlide: function(el) {

  },



  // TODO: Remove this when we ditch mozNotification (bug 952453)
  handleAppopen: function ns_handleAppopen(evt) {
    var manifestURL = evt.detail.manifestURL,
        selector = '[data-manifest-u-r-l="' + manifestURL + '"]';

    var nodes = this.container.querySelectorAll(selector);

    for (var i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i].dataset.obsoleteAPI === 'true') {
        NotificationScreen.removeNotification(nodes[i].dataset.notificationId);
      }
    }
  }
};

NotificationTray.init();
