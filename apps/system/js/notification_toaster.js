'use strict';

var NotificationToaster = {
  toaster: document.getElementById('notification-toaster'),
  toasterIcon: document.getElementById('toaster-icon'),
  toasterTitle: document.getElementById('toaster-title'),
  toasterDetail: document.getElementById('toaster-detail'),

  init: function() {
    ['tap', 'mousedown', 'swipe'].forEach(function(evt) {
      this.toaster.addEventListener(evt, this);
    }, this);

    window.addEventListener('ftuopen', this);
    window.addEventListener('ftudone', this);
  },

  handleEvent: function(evt) {
    switch (evt.type) {
      case 'ftuopen':
        this.toaster.removeEventListener('tap', this);
        break;
      case 'ftudone':
        this.toaster.addEventListener('tap', this);
        break;
    }
  },

  update: function(detail, type, dir) {
    if (detail.icon) {
      this.toasterIcon.src = detail.icon;
      this.toasterIcon.hidden = false;
    } else {
      this.toasterIcon.hidden = true;
    }

    this.toaster.dataset.notificationId = detail.id;
    this.toaster.dataset.type = type;
    this.toasterTitle.textContent = detail.title;
    this.toasterTitle.lang = detail.lang;
    this.toasterTitle.dir = dir;

    this.toasterDetail.textContent = detail.text;
    this.toasterDetail.lang = detail.lang;
    this.toasterDetail.dir = dir;
  },

  play: function() {
    this.toaster.classList.add('displayed');
    this.toaster.addEventListener('animationend', function onDone() {
      this.toaster.removeEventListener('animationEnd', onDone);
      this.toaster.classList.remove('displayed');
    }.bind(this));
  }
};

NotificationToaster.init();
