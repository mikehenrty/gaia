!function() {

  function debug(str) {
    //dump('mozMobileConnection: ' + str + '\n');
  }

  var initialized = true;
  var fakeNetwork = { shortName: 'Fake Orange F', mcc: '208', mnc: '1' };
  var fakeVoice = {
    network: fakeNetwork,
    state: 'registered',
    roaming: false,
    connected: true,
    relSignalStrength: 80,
    emergencyCallsOnly: false
  };
  var fakeData = {
    network: fakeNetwork,
    type: 'umts',
    connected: true,
    roaming: false,
    relSignalStrength: 80
  };

  var fakeNetwork2 = { shortName: 'Verizon Fake', mcc: '208', mnc: '1' };
  var fakeVoice2 = {
    network: fakeNetwork2,
    state: 'registered',
    roaming: false,
    connected: true,
    relSignalStrength: 80,
    emergencyCallsOnly: true
  };
  var fakeData2 = {
    network: fakeNetwork2,
    type: 'edge',
    connected: true,
    roaming: true,
    relSignalStrength: 60
  };

  function fakeEventListener(type, callback, bubble) {
    if (initialized) {
      if (typeof callback === 'function') {
        setTimeout(callback.bind(this, { iccId: this.iccId }));
      }
      return;
    }

    // simulates a connection to a data network;
    setTimeout(function fakeCallback() {
      initialized = true;
      if (typeof callback === 'function') {
        callback({ iccId: this.iccId });
      }
    }.bind(this), 5000);
  }

  var mobileConnections = [{
    iccId: 111,
    addEventListener: fakeEventListener,
    removeEventListener: function() {},
    getCallWaitingOption: FFOS_RUNTIME.domRequest(true),
    getCallForwardingOption: FFOS_RUNTIME.domRequest(1),
    setCallWaitingOption: FFOS_RUNTIME.domRequest(),
    getCallingLineIdRestriction: FFOS_RUNTIME.domRequest(),
    setVoicePrivacyMode: FFOS_RUNTIME.domRequest(),
    getVoicePrivacyMode: FFOS_RUNTIME.domRequest(),
    setRadioEnabled: FFOS_RUNTIME.domRequest(),
    getRadioEnabled: FFOS_RUNTIME.domRequest(),
    getRoamingPreference: FFOS_RUNTIME.domRequest(),
    setRoamingPreference: FFOS_RUNTIME.domRequest(),
    getPreferredNetworkType:  FFOS_RUNTIME.domRequest(),
    setPreferredNetworkType:  FFOS_RUNTIME.domRequest(),
    get data() {
      return initialized ? fakeData : null;
    },
    get voice() {
      return initialized ? fakeVoice : null;
    }
  }];

  if (window._shimDualSim) {
    mobileConnections.push({
      iccId: 222,
      addEventListener: fakeEventListener,
      removeEventListener: function() {},
      getCallWaitingOption: FFOS_RUNTIME.domRequest(true),
      getCallForwardingOption: FFOS_RUNTIME.domRequest(1),
      setCallWaitingOption: FFOS_RUNTIME.domRequest(),
      getCallingLineIdRestriction: FFOS_RUNTIME.domRequest(),
      setVoicePrivacyMode: FFOS_RUNTIME.domRequest(),
      getVoicePrivacyMode: FFOS_RUNTIME.domRequest(),
      setRadioEnabled: FFOS_RUNTIME.domRequest(),
      getRadioEnabled: FFOS_RUNTIME.domRequest(),
      getRoamingPreference: FFOS_RUNTIME.domRequest(),
      setRoamingPreference: FFOS_RUNTIME.domRequest(),
      getPreferredNetworkType:  FFOS_RUNTIME.domRequest(),
      setPreferredNetworkType:  FFOS_RUNTIME.domRequest(),
      get data() {
        return initialized ? fakeData2 : null;
      },
      get voice() {
        return initialized ? fakeVoice2 : null;
      }
    });

  }

  FFOS_RUNTIME.makeNavigatorShim('mozMobileConnections',
                                 mobileConnections, true);

}();
