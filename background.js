var upnpEventListener = null;

function upnpEventCallback(device, event) {
  chrome.runtime.sendMessage({
    type: 'deviceEvent',
    device: device,
    event: event
  });
}

function discoveryDeviceCallback(device) {
  chrome.runtime.sendMessage({
    type: 'deviceDiscovery',
    device: device
  });

  // Don't subscribe to events from Sonos BRIDGE device
  if (device.modelDescription === 'Sonos BRIDGE') {
    return;
  }

  // TODO: Allow foreground page to signal not to listen for events for this device
  // This would allow to ignore events for invisible Sonos devices
  // Track changes, play/stop events
  upnpEventListener.subscribeServiceEvent(device, 'AVTransport', upnpEventCallback);

  // Volume control events
  upnpEventListener.subscribeServiceEvent(device, 'RenderingControl', upnpEventCallback);

  // Queue change events
  upnpEventListener.subscribeServiceEvent(device, 'Queue', upnpEventCallback);

  // Group management events
  upnpEventListener.subscribeServiceEvent(device, 'GroupManagement', upnpEventCallback);
}

function discoveryTimeoutCallback() {
  chrome.runtime.sendMessage({
    type: 'discoveryTimeout'
  });
}

function registerCallback(registrationId) {
  if (chrome.runtime.lastError) {
    // When the registration fails, handle the error and retry the
    // registration later.
    return;
  }

  // Send the registration token to your application server.
  sendRegistrationId(function(succeed) {
    // Once the registration token is received by your server,
    // set the flag such that register will not be invoked
    // next time when the app starts up.
    console.log("registrationId: " + registrationId)
    if (succeed)
      chrome.storage.local.set({registered: true});
  });
}

function sendRegistrationId(callback) {
  callback()
  // Send the registration token to your application server
  // in a secure way.
}

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('zonos.html', {
    id: 'zonos',
    innerBounds: {
      width: 400,
      height: 500,
      minWidth: 400,
      minHeight: 500,
    }
  });

  upnpEventListener = new UpnpEventListener(3400, upnpEventCallback);
  new UpnpDiscovery(discoveryDeviceCallback, discoveryTimeoutCallback, 'urn:schemas-upnp-org:device:ZonePlayer:1');

  // Register on GCM to receive push notifications
  // https://developers.google.com/cloud-messaging/chrome/client
  chrome.gcm.register(["715515727771"], registerCallback);
  // chrome.storage.local.get("registered", function(result) {
  //   // If already registered, bail out.
  //   console.log("GCM: check...")
  //   if (result["registered"])
  //     console.log("GCM: registered")
  //     return;
  //
  //   // Up to 100 senders are allowed.
  //   var senderIds = ["715515727771"];
  //   console.log("GCM: registering...")
  //   chrome.gcm.register(senderIds, registerCallback);
  // });
});

chrome.runtime.onSuspend.addListener(function() {
  chrome.socket.destroy(upnpEventListener.socketId);
});


chrome.gcm.onMessage.addListener(function(message) {
  var action = message['data']['action']
  console.log("Notification received: " + message['data']['action'])
  // A message is an object with a data property that
  // consists of key-value pairs.
  chrome.runtime.sendMessage({
    type: 'pushAction',
    action: action
  });
});