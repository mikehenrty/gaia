'use strict';

(function(exports) {

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
        case 'tap':
        case 'mousedown':
          this.activate();
      }
    },

    update: function(detail, type, dir) {
      if (detail.icon) {
        this.toasterIcon.src = detail.icon;
      } else {
        this.toasterIcon.src = 'style/icons/notification.png';
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

    activate: function() {
      this.close();
    },

    close: function() {
      this.toaster.classList.remove('displayed');
      this.toaster.classList.remove('fadeDetail');
      this.toaster.classList.remove('showDetail');
    },

    play: function() {
      this.toaster.addEventListener('animationend', function onDone() {
        this.toaster.removeEventListener('animationend', onDone);
        this.toaster.classList.remove('toasty');
        this.toaster.classList.add('displayed');
        setTimeout(function() {
          this.toaster.classList.add('fadeTitle');
          this.toaster.classList.add('showDetail');
        }, 1000);
        setTimeout(function() {
          this.close();
        }.bind(this), 3000);
      }.bind(this));
      this.toaster.classList.add('toasty');
    }
  };

  NotificationToaster.init();

  exports.NotificationToaster = NotificationToaster;
}(window));
