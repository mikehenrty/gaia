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

  init: function() {
    this.swipeTarget.addEventListener('touchstart', this);
    this.swipeTarget.addEventListener('touchmove', this);
    this.swipeTarget.addEventListener('touchend', this);
    this.topBar.addEventListener('touchstart', this);
    this.topBar.addEventListener('touchmove', this);
    this.topBar.addEventListener('touchend', this);
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
  }
};

NotificationTray.init();
