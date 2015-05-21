/* global BookmarksDatabase */
/* global eventSafety */
/* global IconsHelper */
/* global LazyLoader */
/* global ModalDialog */
/* global MozActivity */
/* global SettingsListener */
/* global Service */
/* global PinCard */
/* global UrlHelper */

'use strict';

(function(exports) {
  const DEFAULT_ICON_URL = '/style/chrome/images/default_icon.png';

  var _id = 0;

  var newTabManifestURL = null;
  SettingsListener.observe('rocketbar.newTabAppURL', '',
    function(url) {
      // The application list in applications.js is not yet ready, so we store
      // only the manifestURL for now and we look up the application whenever
      // we trigger a new window.
      newTabManifestURL = url ? url.match(/(^.*?:\/\/.*?\/)/)[1] +
        'manifest.webapp' : '';
    });

  /**
   * The chrome UI of the AppWindow.
   *
   * @class AppChrome
   * @param {AppWindow} app The app window instance this chrome belongs to.
   * @extends BaseUI
   */
  var AppChrome = function AppChrome(app) {
    this.app = app;
    this.instanceID = _id++;
    this.containerElement = app.element;
    this.scrollable = app.browserContainer;
    this.previousOrigin = '';
    this.pinned = false;
    this.currentScope = null;
    this.render();

    if (this.app.themeColor) {
      this.setThemeColor(this.app.themeColor);
    }

    var chrome = this.app.config.chrome;
    if (!this.app.isBrowser() && chrome && !chrome.scrollable) {
      this._fixedTitle = true;
      this.title.dataset.l10nId = 'search-the-web';
    } else if (!this.app.isBrowser() && this.app.name) {
      this.title.textContent = this.app.name;
    }

    this.reConfig();
  };

  AppChrome.prototype = Object.create(window.BaseUI.prototype);

  AppChrome.prototype.CLASS_NAME = 'AppChrome';

  AppChrome.prototype.EVENT_PREFIX = 'chrome';

  AppChrome.prototype._DEBUG = false;

  AppChrome.prototype.reConfig = function() {
    var chrome = this.app.config.chrome;
    if (!chrome) {
      return;
    }

    if (this.isSearchApp()) {
      this.app.element.classList.add('search-app');
      this.title.setAttribute('data-l10n-id', 'search-or-enter-address');
    } else {
      this.app.element.classList.remove('search-app');
    }

    if (chrome.bar) {
      this.app.element.classList.add('bar');
      this.bar.classList.add('visible');
    }

    if (chrome.scrollable) {
      this.app.element.classList.add('collapsible');

      if (this.app.isPrivateBrowser()) {
        this.element.classList.add('private');
      } else {
        this.app.element.classList.add('light');
      }

      this.scrollable.scrollgrab = true;
    }

    if (chrome.maximized) {
      this.element.classList.add('maximized');

      if (!this.app.isBrowser()) {
        this.app.element.classList.add('scrollable');
      }
    }
  };

  AppChrome.prototype.combinedView = function an_combinedView() {
    var className = this.CLASS_NAME + this.instanceID;

    return `<div class="chrome chrome-combined" id="${className}">
              <gaia-progress></gaia-progress>
              <div class="controls">
                <button type="button" class="back-button"
                        data-l10n-id="back-button" disabled></button>
                <button type="button" class="forward-button"
                        data-l10n-id="forward-button" disabled></button>
                <div class="urlbar js-chrome-ssl-information">
                  <section role="dialog" class="pin-dialog hidden">
                    <a href="#" data-action="cancel"></a>
                    <a href="#" data-action="next"></a>
                    <a href="#" data-action="previous" hidden></a>
                    <header><h2>Pin Page</h2></header>
                    <div class="card-container"></div>
                    <button data-pin="page" data-action="pin">Pin</button>
                    <span>from</span>
                    <span class="origin"></span>
                  </section>
                  <span class="pb-icon"></span>
                  <div class="site-icon"></div>
                  <div class="chrome-ssl-indicator chrome-title-container">
                    <span class="title" dir="auto"></span>
                  </div>
                  <button type="button" class="reload-button"
                          data-l10n-id="reload-button" disabled></button>
                  <button type="button" class="stop-button"
                          data-l10n-id="stop-button"></button>
                </div>
                <button type="button" class="menu-button" alt="Menu"></button>
                <button type="button" class="windows-button"
                        data-l10n-id="windows-button"></button>
              </div>
            </div>`;
  };

  AppChrome.prototype.view = function an_view() {
    var className = this.CLASS_NAME + this.instanceID;

    return `<div class="chrome chrome-plain" id="${className}">
            <gaia-progress></gaia-progress>
            <section role="region" class="bar">
              <gaia-header action="close" class='js-chrome-ssl-information'>
                <div class="chrome-ssl-indicator chrome-ssl-indicator-ltr">
                </div>
                <h1 class="title"></h1>
                <div class="chrome-ssl-indicator chrome-ssl-indicator-rtl">
                </div>
              </gaia-header>
            </section>
          </div>`;
  };

  AppChrome.prototype.overflowMenuView = function an_overflowMenuView() {
    var template = `<gaia-overflow-menu>

     <button id="new-window" data-l10n-id="new-window">
     </button>

     <button id="new-private-window" data-l10n-id="new-private-window">
     </button>

     <button id="add-to-home" data-l10n-id="add-to-home-screen" hidden>
     </button>

     <button id="share" data-l10n-id="share">
     </button>

    </gaia-overflow-menu>`;
    return template;
  };

  AppChrome.prototype.__defineGetter__('height', function ac_getHeight() {
    if (this._height) {
      return this._height;
    }

    this._height = this.element.getBoundingClientRect().height;
    return this._height;
  });

  AppChrome.prototype._fetchElements = function ac__fetchElements() {
    this.element = this.containerElement.querySelector('.chrome');

    this.progress = this.element.querySelector('gaia-progress');
    this.reloadButton = this.element.querySelector('.reload-button');
    this.forwardButton = this.element.querySelector('.forward-button');
    this.stopButton = this.element.querySelector('.stop-button');
    this.backButton = this.element.querySelector('.back-button');
    this.menuButton = this.element.querySelector('.menu-button');
    this.windowsButton = this.element.querySelector('.windows-button');
    this.title = this.element.querySelector('.title');
    this.siteIcon = this.element.querySelector('.site-icon');
    this.pinDialog = this.element.querySelector('.pin-dialog');
    this.pinButton = this.element.querySelector('button[data-action="pin"]');
    var closeSelector = '.pin-dialog a[data-action="cancel"]';
    var nextSelector = '.pin-dialog a[data-action="next"]';
    var previousSelector = '.pin-dialog a[data-action="previous"]';
    this.closePin = this.element.querySelector(closeSelector);
    this.nextPin = this.element.querySelector(nextSelector);
    this.previousPin = this.element.querySelector(previousSelector);
    this.sslIndicator =
      this.element.querySelector('.js-chrome-ssl-information');

    this.bar = this.element.querySelector('.bar');
    if (this.bar) {
      this.header = this.element.querySelector('gaia-header');
    }

    if (this.reloadButton) {
      this.reloadButton.disabled = !this.hasNavigation();
    }
  };

  AppChrome.prototype.handleEvent = function ac_handleEvent(evt) {
    switch (evt.type) {
      case 'rocketbar-overlayclosed':
        this.collapse();
        break;

      case 'click':
        this.handleClickEvent(evt);
        break;

      case 'action':
        this.handleActionEvent(evt);
        break;

      case 'scroll':
        this.handleScrollEvent(evt);
        break;

      case '_loading':
        this.show(this.progress);
        this.progress.start();
        break;

      case '_loaded':
        this.hide(this.progress);
        this.progress.stop();
        break;

      case 'mozbrowserloadstart':
        this.handleLoadStart(evt);
        break;

      case 'mozbrowserloadend':
        this.handleLoadEnd(evt);
        break;

      case 'mozbrowsererror':
        this.handleError(evt);
        break;

      case '_locationchange':
        this.handleLocationChange();
        break;

      case 'mozbrowserscrollareachanged':
        this.handleScrollAreaChanged(evt);
        break;

      case '_securitychange':
        this.handleSecurityChanged(evt);
        break;

      case '_namechanged':
        this.handleNameChanged();
        break;

      case '_manifestchange':
        this.handleManifestChange();
        break;

      case 'mozbrowsermetachange':
        this.handleMetaChange(evt);
        break;

    }
  };

  AppChrome.prototype.handleClickEvent = function ac_handleClickEvent(evt) {
    switch (evt.target) {
      case this.reloadButton:
        this.app.reload();
        break;

      case this.closePin:
        evt.preventDefault();
        this.hidePinDialog();
        break;

      case this.nextPin:
        evt.preventDefault();
        this.nextCard();
        break;

      case this.previousPin:
        evt.preventDefault();
        this.previousCard();
        break;

      case this.stopButton:
        this.app.stop();
        break;

      case this.backButton:
        this.app.back();
        break;

      case this.forwardButton:
        this.app.forward();
        break;

      case this.siteIcon:
        evt.stopImmediatePropagation();
        this.showPinDialog();
        break;

      case this.title:
        this.titleClicked();
        break;

      case this.menuButton:
        this.showOverflowMenu();
        break;

      case this.windowsButton:
        this.showWindows();
        break;

      case this.newWindowButton:
        evt.stopImmediatePropagation();
        this.onNewWindow();
        break;

      case this.newPrivateWinButton:
        // Currently not in use, awaiting shared menu web components work.
        evt.stopImmediatePropagation();
        this.onNewPrivateWindow();
        break;

      case this.addToHomeButton:
        evt.stopImmediatePropagation();
        this.onAddToHome();
        break;

      case this.shareButton:
        evt.stopImmediatePropagation();
        this.onShare();
        break;

      case this.pinButton:
        this.savePin();
        break;
    }
  };

  AppChrome.prototype.showPinDialog = function ac_showPinDialog() {
    if (!this.isMaximized()) {
      return;
    }
    this.populatePinDialog();
    this.pinDialog.classList.remove('hidden');
  };

  AppChrome.prototype.nextCard = function ac_nextCard() {
    var cards = this.pinDialog.querySelectorAll('.card-container > div');
    cards[0].classList.add('right');
    cards[1].classList.remove('left');
    this.pinButton.dataset.pin = 'site';
    this.nextPin.hidden = true;
    var title = 'Pin ' + this.app.name;
    this.pinDialog.querySelector('header h2').textContent = title;
    this.previousPin.hidden = false;
  };

  AppChrome.prototype.previousCard = function ac_previousCard() {
    var cards = this.pinDialog.querySelectorAll('.card-container > div');
    cards[0].classList.remove('right');
    cards[1].classList.add('left');
    this.pinButton.dataset.pin = 'page';
    this.pinDialog.querySelector('header h2').textContent = 'Pin Page';
    this.nextPin.hidden = false;
    this.previousPin.hidden = true;
  };

  AppChrome.prototype.hidePinDialog = function ac_hidePinDialog() {
    this.pinDialog.classList.add('hidden');
  };

  AppChrome.prototype.generateSitePin = function ac_generateSitePin(icon) {
    var card = document.createElement('div');
    var img = document.createElement('img');
    var span = document.createElement('span');
    span.className = 'appName';
    img.className = 'site-pin';
    img.src = icon;
    card.appendChild(img);
    card.appendChild(span);
    card.className = 'left';
    return card;
  };

  AppChrome.prototype.savePin = function ac_savePin() {
    this.pin();
    if (this.pinButton.dataset.pin == 'page') {
      window.places.setPinned(this._currentURL, true).then(function() {
        console.log('Successfully pinned page in Places database.');
      }, function() {
        console.error('Failed to pin page in Places database.');
      });
    } else if (this.pinButton.dataset.pin == 'site') {
      var siteId = null;
      var siteObject = {};
      var manifestUrl = this.app.webManifestURL;
      var manifestObject = this.app.webManifestObject;
      var pageUrl = this.app.config.url;
      if (manifestUrl && manifestObject) {
        siteId = manifestUrl;
        siteObject.manifest = manifestObject;
        siteObject.name = manifestObject.short_name || manifestObject.name ||
          UrlHelper.getHostname(pageUrl);
        siteObject.scope = new URL(manifestObject.scope || '/', pageUrl).href;
        siteObject.manifestUrl = manifestUrl;
        siteObject.url = manifestObject.start_url ||
          UrlHelper.getOrigin(this.app.config.url);
      } else {
        siteId = UrlHelper.getOrigin(this.app.config.url);
        siteObject.name = this.app.name || UrlHelper.getHostname(pageUrl);
        siteObject.url = UrlHelper.getOrigin(this.app.config.url);
        siteObject.scope = new URL('/', pageUrl).href;
      }
      siteObject.id = siteId;
      siteObject.frecency = 1;
      siteObject.pinned = true;
      siteObject.pinnedFrom = pageUrl;

      BookmarksDatabase.put(siteObject, siteId).then(function() {
        console.log('Successfully saved site ' + JSON.stringify(siteObject));
      }, function() {
        console.error('Failed to save site');
      });
    }
  };

  AppChrome.prototype.pin = function ac_pin() {
    this.pinDialog.classList.add('hidden');
    this.collapse();
    this.pinned = true;
    this.app.element.classList.remove('collapsible');
  };

  AppChrome.prototype.unpin = function ac_unpin() {
    if (this.pinned) {
      this.pinned = false;
      this.app.element.classList.add('collapsible');
      this.scrollable.scrollTop = 0;
    }
    this.maximize();
  };

  AppChrome.prototype.titleClicked = function ac_titleClicked() {
    var contextMenu = this.app.contextmenu && this.app.contextmenu.isShown();
    var locked = Service && Service.locked;

    if (locked || contextMenu) {
      return;
    }

    if (!this.isMaximized()) {
      if (this.pinned) {
        this.app.element.classList.add('collapsible');
        this.scrollable.scrollTop = 0;
      }
      this.maximize();
    } else {
      window.dispatchEvent(new CustomEvent('global-search-request'));
    }
  };

  AppChrome.prototype.handleActionEvent = function ac_handleActionEvent(evt) {
    if (evt.detail.type === 'close') {
      this.app.kill();
    }
  };

  AppChrome.prototype.handleScrollEvent = function ac_handleScrollEvent(evt) {
    if (!this.containerElement.classList.contains('scrollable')) {
      return;
    }

    // Ideally we'd animate based on scroll position, but until we have
    // the necessary spec and implementation, we'll animate completely to
    // the expanded or collapsed state depending on whether it's at the
    // top or not.
    // XXX Open a bug since I wonder if there is scrollgrab rounding issue
    // somewhere. While panning from the bottom to the top, there is often
    // a scrollTop position of scrollTopMax - 1, which triggers the transition!
    var element = this.element;
    if (this.scrollable.scrollTop >= this.scrollable.scrollTopMax - 1) {
      this.hidePinDialog();
      element.classList.remove('maximized');
      if (this.pinned) {
        this.app.element.classList.remove('collapsible');
      }
    } else if (!this.pinned) {
      element.classList.add('maximized');
    }

    if (this.app.isActive()) {
      this.app.publish('titlestatechanged');
    }
  };

  AppChrome.prototype._registerEvents = function ac__registerEvents() {
    if (this.useCombinedChrome()) {
      LazyLoader.load('shared/js/bookmarks_database.js', function() {
        this.updateAddToHomeButton();
      }.bind(this));
      LazyLoader.load('shared/elements/gaia_overflow_menu/script.js');

      this.stopButton.addEventListener('click', this);
      this.reloadButton.addEventListener('click', this);
      this.backButton.addEventListener('click', this);
      this.forwardButton.addEventListener('click', this);
      this.siteIcon.addEventListener('click', this);
      this.closePin && this.closePin.addEventListener('click', this);
      this.nextPin && this.nextPin.addEventListener('click', this);
      this.previousPin && this.previousPin.addEventListener('click', this);
      this.title.addEventListener('click', this);
      this.scrollable.addEventListener('scroll', this);
      this.menuButton.addEventListener('click', this);
      this.windowsButton.addEventListener('click', this);
      this.pinButton && this.pinButton.addEventListener('click', this);
    } else {
      this.header.addEventListener('action', this);
    }

    this.app.element.addEventListener('mozbrowserloadstart', this);
    this.app.element.addEventListener('mozbrowserloadend', this);
    this.app.element.addEventListener('mozbrowsererror', this);
    this.app.element.addEventListener('_locationchange', this);
    this.app.element.addEventListener('_namechanged', this);
    this.app.element.addEventListener('_manifestchange', this);
    this.app.element.addEventListener('mozbrowsermetachange', this);
    this.app.element.addEventListener('mozbrowserscrollareachanged', this);
    this.app.element.addEventListener('_securitychange', this);
    this.app.element.addEventListener('_loading', this);
    this.app.element.addEventListener('_loaded', this);

    var element = this.element;

    var animEnd = function(evt) {
      if (evt && evt.target !== element) {
        return;
      }
      var publishEvent = this.isMaximized() ? 'expanded' : 'collapsed';

      this.app.publish('chrome' + publishEvent);
    }.bind(this);

    element.addEventListener('transitionend', animEnd);
  };

  AppChrome.prototype._unregisterEvents = function ac__unregisterEvents() {

    if (this.useCombinedChrome()) {
      this.stopButton.removeEventListener('click', this);
      this.menuButton.removeEventListener('click', this);
      this.windowsButton.removeEventListener('click', this);
      this.pinButton.removeEventListener('click', this);
      this.reloadButton.removeEventListener('click', this);
      this.backButton.removeEventListener('click', this);
      this.forwardButton.removeEventListener('click', this);
      this.title.removeEventListener('click', this);
      this.scrollable.removeEventListener('scroll', this);

      if (this.newWindowButton) {
        this.newWindowButton.removeEventListener('click', this);
      }

      if (this.addToHomeButton) {
        this.addToHomeButton.removeEventListener('click', this);
      }

      if (this.shareButton) {
        this.shareButton.removeEventListener('click', this);
      }
    } else {
      this.header.removeEventListener('action', this);
    }

    if (!this.app) {
      return;
    }

    this.app.element.removeEventListener('mozbrowserloadstart', this);
    this.app.element.removeEventListener('mozbrowserloadend', this);
    this.app.element.removeEventListener('mozbrowsererror', this);
    this.app.element.removeEventListener('_locationchange', this);
    this.app.element.removeEventListener('_namechanged', this);
    this.app.element.removeEventListener('_manifestchange', this);
    this.app.element.removeEventListener('mozbrowsermetachange', this);
    this.app.element.removeEventListener('_loading', this);
    this.app.element.removeEventListener('_loaded', this);
    this.app = null;
  };

  AppChrome.prototype.handleNameChanged =
    function ac_handleNameChanged() {
    if (this._fixedTitle) {
      return;
    }
    this.title.textContent = this.app.name;
  };

  AppChrome.prototype.handleManifestChange =
    function ac_handleManifestChange() {
    if (this.app.webManifestURL) {
      this.updateScope(this.app.webManifestURL);
    }
  };

  AppChrome.prototype.handleScrollAreaChanged = function(evt) {
    // Check if the page has become scrollable and add the scrollable class.
    // We don't check if a page has stopped being scrollable to avoid oddness
    // with a page oscillating between scrollable/non-scrollable states, and
    // other similar issues that Firefox for Android is still dealing with
    // today.
    if (this.containerElement.classList.contains('scrollable')) {
      return;
    }

    // We allow the bar to collapse if the page is greater than or equal to
    // the area of the window with a collapsed bar. Strictly speaking, we'd
    // allow it to collapse if it was greater than the area of the window with
    // the expanded bar, but due to prevalent use of -webkit-box-sizing and
    // plain mistakes, this causes too many false-positives.
    if (evt.detail.height >= this.containerElement.clientHeight) {
      this.containerElement.classList.add('scrollable');
    }
  };

  AppChrome.prototype.handleSecurityChanged = function(evt) {
    var sslState = this.app.getSSLState();
    this.sslIndicator.dataset.ssl = sslState;
    this.sslIndicator.classList.toggle(
      'chrome-has-ssl-indicator', sslState === 'broken' || sslState === 'secure'
    );
    this.pinDialog.classList.toggle('secure',
      sslState === 'broken' || sslState === 'secure'
    );
  };

  AppChrome.prototype.handleMetaChange =
    function ac__handleMetaChange(evt) {
      var detail = evt.detail;

      if (detail.name !== 'theme-color' || !detail.type) {
        return;
      }

      // If the theme-color meta is removed, let's reset the color.
      var color = '';

      // Otherwise, set it to the color that has been asked.
      if (detail.type !== 'removed') {
        color = detail.content;
      }

      this.setThemeColor(color);
    };

  AppChrome.prototype.setThemeColor = function ac_setThemColor(color) {
    // Do not set theme color for private windows
    if (this.app.isPrivateBrowser()) {
      return;
    }

    var bottomApp = this.app.getBottomMostWindow();

    if (this.app.CLASS_NAME === 'PopupWindow' &&
      bottomApp &&
      bottomApp.themeColor) {
      color = bottomApp.themeColor;
    }

    this.app.themeColor = color;
    this.element.style.backgroundColor = color;

    if (!this.app.isHomescreen) {
      this.scrollable.style.backgroundColor = color;
    }

    if (color === 'transparent' || color === '') {
      this.app.element.classList.remove('light');
      this.app.publish('titlestatechanged');
      return;
    }

    var self = this;
    var finishedFade = false;
    var endBackgroundFade = function(evt) {
      if (evt && evt.propertyName != 'background-color') {
        return;
      }
      finishedFade = true;
      if (self.element) {
        self.element.removeEventListener('transitionend', endBackgroundFade);
      }
    };
    eventSafety(this.element, 'transitionend', endBackgroundFade, 1000);

    window.requestAnimationFrame(function updateAppColor() {
      if (finishedFade || !self.element) {
        return;
      }

      var computedColor = window.getComputedStyle(self.element).backgroundColor;
      var colorCodes = /rgb\((\d+), (\d+), (\d+)\)/.exec(computedColor);
      if (!colorCodes || colorCodes.length === 0) {
        return;
      }

      var r = parseInt(colorCodes[1]);
      var g = parseInt(colorCodes[2]);
      var b = parseInt(colorCodes[3]);
      var brightness =
        Math.sqrt((r*r) * 0.241 + (g*g) * 0.691 + (b*b) * 0.068);

      var wasLight = self.app.element.classList.contains('light');
      var isLight = brightness > 200;
      if (wasLight != isLight) {
        self.app.element.classList.toggle('light', isLight);
        self.app.publish('titlestatechanged');
      }
      window.requestAnimationFrame(updateAppColor);
    });
  };

  AppChrome.prototype.render = function() {
    this.publish('willrender');

    var view = this.useCombinedChrome() ? this.combinedView() : this.view();
    this.app.element.insertAdjacentHTML('afterbegin', view);

    this._fetchElements();
    this._registerEvents();
    this.publish('rendered');
  };

  AppChrome.prototype.useLightTheming = function ac_useLightTheming() {
    // The rear window should dictate the status bar color when the front
    // window is a popup.
    if (this.app.CLASS_NAME == 'PopupWindow' &&
        this.app.rearWindow &&
        this.app.rearWindow.appChrome) {
      return this.app.rearWindow.appChrome.useLightTheming();
    }
    // All other cases can use the front window.
    return this.app.element.classList.contains('light');
  };

  AppChrome.prototype.useCombinedChrome = function ac_useCombinedChrome(evt) {
    return this.app.config.chrome && !this.app.config.chrome.bar;
  };

  AppChrome.prototype.updateAddToHomeButton =
    function ac_updateAddToHomeButton() {
      if (!this.addToHomeButton || !BookmarksDatabase) {
        return;
      }

      // Enable/disable the bookmark option
      BookmarksDatabase.get(this._currentURL).then(function resolve(result) {
        this.addToHomeButton.hidden = !!result;
      }.bind(this),
      function reject() {
        this.addToHomeButton.hidden = true;
      }.bind(this));
    };

  AppChrome.prototype.handleLocationChange =
    function ac_handleLocationChange() {
    if (!this.app) {
      return;
    }

    var url = this.app.config.url;

    // Check if this is just a location-change to an anchor tag.
    var anchorChange = false;
    if (this._currentURL && url) {
      anchorChange =
        this._currentURL.replace(/#.*/g, '') ===
        url.replace(/#.*/g, '');
    }

    this._currentURL = url;
    if (!this._fixedTitle) {
      this.title.textContent = this.app.name;
    }

    if (this.backButton && this.forwardButton) {
      this.app.canGoForward(function forwardSuccess(result) {
        if (!this.hasNavigation()) {
          return;
        }
        this.forwardButton.disabled = !result;
      }.bind(this));

      this.app.canGoBack(function backSuccess(result) {
        if (!this.hasNavigation()) {
          return;
        }
        this.backButton.disabled = !result;
      }.bind(this));
    }

    this.updateAddToHomeButton();

    // We update the icon if the new page has a different origin.
    var origin = UrlHelper.getOrigin(url);

    if (this.previousOrigin !== origin && this.siteIcon) {
      console.log('Origin changed %s to %s', this.previousOrigin, origin);
      this.siteIcon.style.backgroundImage = `url("${DEFAULT_ICON_URL}")`;
    } else {
      console.log('Same origin %s', origin);
    }

    this.previousOrigin = origin;

    this.populatePinDialog();

    if (!this.app.isBrowser()) {
      return;
    }

    if (!anchorChange) {
      // Make the rocketbar unscrollable until the page resizes to the
      // appropriate height.
      this.containerElement.classList.remove('scrollable');
    }

    // Set the title for the private browser landing page.
    // This is explicitly placed in the locationchange handler as it's
    // currently possibly to navigate back to the landing page with the
    // back button. Otherwise it could be in the constructor.
    if (this.app.isPrivateBrowser() &&
      url.startsWith('app:')) {
      this.title.dataset.l10nId = 'search-or-enter-address';
    }

    if (this.isInCurrentScope(url)) {
      return;
    } else {
      this.updateScope(origin);
    }
  };

  AppChrome.prototype.isInCurrentScope =
    function ac_isInCurrentScope(url) {
    if (this.currentScope) {
      var substring = url.substring(this.currentScope.length);
      if (substring == this.currentScope) {
        return true;
      }
    } else {
      return false;
    }
  };

  AppChrome.prototype.updateScope = function ac_updateScope(siteUrl) {
    this.currentScope = null;
    // Is site pinned?
    BookmarksDatabase.get(siteUrl).then((function(siteObject) {
      if (siteObject && siteObject.pinned) {
        this.currentScope = siteObject.scope;
        this.pin();
      } else {
        this.checkForPinnedPage();
      }
    }).bind(this), (function() {
      this.checkForPinnedPage();
    }).bind(this));
  };

  AppChrome.prototype.checkForPinnedPage = function ac_checkForPinnedPage() {
    window.places.getPlace(this.app.config.url).then((function(place) {
      if (place && place.pinned) {
        this.pin();
      } else {
        this.unpin();
      }
    }).bind(this), (function() {
      this.unpin();
    }).bind(this));
  };

  AppChrome.prototype.handleLoadStart = function ac_handleLoadStart(evt) {
    this.containerElement.classList.add('loading');
  };

  AppChrome.prototype.handleLoadEnd = function ac_handleLoadEnd(evt) {
    this.containerElement.classList.remove('loading');
    this.setSiteIcon();
  };

  AppChrome.prototype.handleError = function ac_handleError(evt) {
    if (evt.detail && evt.detail.type === 'fatal') {
      return;
    }
    if (this.useCombinedChrome() &&
      this.app.config.chrome.scrollable && !this.pinned) {
      // When we get an error, keep the rocketbar maximized.
      this.element.classList.add('maximized');
      this.containerElement.classList.remove('scrollable');
    }
  };

  AppChrome.prototype.maximize = function ac_maximize(callback) {
    var element = this.element;
    element.classList.add('maximized');
    window.addEventListener('rocketbar-overlayclosed', this);

    if (!callback) {
      return;
    }
    eventSafety(element, 'transitionend', callback, 250);
  };

  AppChrome.prototype.collapse = function ac_collapse() {
    window.removeEventListener('rocketbar-overlayclosed', this);
    this.element.classList.remove('maximized');
    this.hidePinDialog();
  };

  AppChrome.prototype.isMaximized = function ac_isMaximized() {
    return this.element.classList.contains('maximized');
  };

  AppChrome.prototype.isSearch = function ac_isSearch() {
    var dataset = this.app.config;
    return dataset.searchURL && this._currentURL === dataset.searchURL;
  };

  AppChrome.prototype.isSearchApp = function() {
    return this.app.config.manifest &&
      this.app.config.manifest.role === 'search';
  };

  AppChrome.prototype.hasNavigation = function ac_hasNavigation(evt) {
    return this.app.isBrowser() ||
      (this.app.config.chrome && this.app.config.chrome.navigation);
  };

  AppChrome.prototype.addBookmark = function ac_addBookmark() {
    var dataset = this.app.config;
    var favicons = this.app.favicons;

    var name;
    if (this.isSearch()) {
      name = dataset.searchName;
    } else {
      name = this.title.textContent;
    }
    var url = this._currentURL;

    LazyLoader.load('shared/js/icons_helper.js', (function() {
      IconsHelper.getIcon(url, null, {icons: favicons}).then(icon => {
        var activity = new MozActivity({
          name: 'save-bookmark',
          data: {
            type: 'url',
            url: url,
            name: name,
            icon: icon,
            iconable: false
          }
        });

        if (this.addToHomeButton) {
          activity.onsuccess = function onsuccess() {
            this.addToHomeButton.hidden = true;
          }.bind(this);
        }
      });
    }).bind(this));
  };

  AppChrome.prototype.onAddBookmark = function ac_onAddBookmark() {
    var self = this;
    function selected(value) {
      if (value) {
        self.addBookmark();
      }
    }

    var title = 'add-to-home-screen';
    var options = [];

    if (this.isSearch()) {
      var dataset = this.app.config;
      options.push({
        id: 'search',
        text: {
          raw: dataset.searchName
        }
      });
    } else {
      options.push({
        id: 'origin',
        text: {
          raw: this.title.textContent
        }
      });
    }

    ModalDialog.selectOne(title, options, selected);
  };

  AppChrome.prototype.showWindows = function ac_showWindows() {
    window.dispatchEvent(
      new CustomEvent('taskmanagershow',
                      { detail: { filter: 'browser-only' }})
    );
  };

  AppChrome.prototype.__defineGetter__('overflowMenu',
    // Instantiate the overflow menu when it's needed
    function ac_getOverflowMenu() {
      if (!this._overflowMenu && this.useCombinedChrome() &&
          window.GaiaOverflowMenu) {
        this.app.element.insertAdjacentHTML('afterbegin',
                                            this.overflowMenuView());
        this._overflowMenu = this.containerElement.
          querySelector('gaia-overflow-menu');
        this.newWindowButton = this._overflowMenu.
          querySelector('#new-window');
        this.newPrivateWinButton = this._overflowMenu.
          querySelector('#new-private-window');
        this.addToHomeButton = this._overflowMenu.
          querySelector('#add-to-home');
        this.shareButton = this._overflowMenu.
          querySelector('#share');

        this.newWindowButton.addEventListener('click', this);
        this.newPrivateWinButton.addEventListener('click', this);
        this.addToHomeButton.addEventListener('click', this);
        this.shareButton.addEventListener('click', this);

        this.updateAddToHomeButton();
      }

      return this._overflowMenu;
    });

  AppChrome.prototype.showOverflowMenu = function ac_showOverflowMenu() {
    this.overflowMenu.show();
  };

  AppChrome.prototype.hideOverflowMenu = function ac_hideOverflowMenu() {
    this.overflowMenu.hide();
  };

  /* Bug 1054466 switched the browser overflow menu to use the system style,
   * but we eventually want to switch back to the new style. We can do that
   * by removing this function.
   */
  AppChrome.prototype.showOverflowMenu = function ac_showOverflowMenu() {
    if (this.app.contextmenu) {
      var name = this.isSearch() ?
        this.app.config.searchName : this.title.textContent;
      this.app.contextmenu.showDefaultMenu(newTabManifestURL, name);
    }
  };

  AppChrome.prototype.populatePinDialog = function ac_populate() {
    if (!this.pinDialog) {
      return;
    }

    var origin = UrlHelper.getHostname(this.app.config.url).split('.');
    var originElement = this.pinDialog.querySelector('.origin');
    var tld = originElement.querySelector('.tld');
    if (!tld) {
      tld = document.createElement('span');
      tld.className = 'tld';
    } else {
      tld.remove();
    }
    tld.textContent = origin.slice(origin.length - 2, origin.length).join('.');

    if (origin.length > 2) {
      var subdomains = origin.slice(0, origin.length - 2).join('.');
      originElement.textContent =  subdomains + '.';
    }

    originElement.appendChild(tld);
    this.setPinDialogCard();
    this.previousCard();
  };

  AppChrome.prototype.setPinDialogCard = function ac_setPinDialogCard(url) {
    var currentIcon = window.getComputedStyle(this.siteIcon).backgroundImage;
    currentIcon = currentIcon.replace('url("', '').replace('")', '');
    var info = {
      url: this.app.config.url,
      title: this.app.title,
      icons: JSON.parse('{"' + currentIcon +'":{"sizes":[]}}')
    };
    var card = new PinCard(info);
    var container = this.pinDialog.querySelector('.card-container');
    container.innerHTML = '';
    container.appendChild(card.element);
    var sitePin = this.generateSitePin(currentIcon);
    container.appendChild(sitePin);
    this.setAppName();
  };

  AppChrome.prototype.setAppName = function ac_setAppName() {
    var nameEl = this.pinDialog.querySelector('.card-container .appName');
    nameEl.textContent = this.app.name;
  };

  AppChrome.prototype.setSiteIcon = function ac_setSiteIcon(url) {
    if (!this.siteIcon) {
      return;
    }

    this.siteIcon.style.backgroundImage = `url("${DEFAULT_ICON_URL}")`;

    this.getSiteIconUrl()
      .then(iconUrl => {
        if (iconUrl) {
          this.siteIcon.style.backgroundImage = `url("${iconUrl}")`;
        }
      })
      .catch((err) => {
        console.log('Something went terribly wrong: %s', err);
      });
  };

  AppChrome.prototype.getSiteIconUrl = function ac_getSiteIconUrl() {
    const ICON_SIZE = 32;

    return new Promise((resolve, reject) => {
      if (this.app.webManifestURL) {
        var siteObj = {
          manifestUrl: this.app.webManifestURL,
          manifest: this.app.webManifestObject
        };

        resolve(this.getIconBlob(this.app.config.url, ICON_SIZE,
          {icons: this.app.favicons}, siteObj));
      } else {
        resolve(this.getIconBlob(this.app.config.url, ICON_SIZE,
          {icons: this.app.favicons}));
      }
    });
  };

  AppChrome.prototype.getIconBlob = function ac_getIconBlob(origin, iconSize,
    placeObj = {}, siteObj = {}) {

    return new Promise((resolve, reject) => {
      IconsHelper.getIcon(origin, iconSize, placeObj, siteObj)
        .then(iconBlob => {
          var iconUrl = URL.createObjectURL(iconBlob.blob);

          resolve(iconUrl);
        })
        .catch(err => {
          reject(err);
        });
    });
  };

  exports.AppChrome = AppChrome;
}(window));
