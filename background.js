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

function registerCallback(subscriptionId) {
  if (chrome.runtime.lastError) {
    console.log("GCM registration failed")
    return;
  }

  console.log("GCM subscription ID: " + subscriptionId)
  talkToMosaicServer(subscriptionId)
  chrome.storage.local.set({'mosaic_subscriptionId': subscriptionId});
  chrome.storage.local.set({'mosaic_hour': getHour()});
}

// ToDo: Send the registration token to your application server.
function talkToMosaicServer(subscriptionId) {
  console.log('Call Mosaic backend here')
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
  var mosaicGCMSenderId = '715515727771'
  chrome.storage.local.get('mosaic_hour', function(time) {
    if (time.mosaic_hour + 3 > getHour()) {
      chrome.storage.local.get('mosaic_subscriptionId', function(result) {
        if (result.mosaic_subscriptionId) {
          console.log("Found in local: " + result.mosaic_subscriptionId)
          talkToMosaicServer(result.mosaic_subscriptionId)
        }
        else {
          chrome.gcm.register([mosaicGCMSenderId], registerCallback);
        }
      })
    }
    else {
      chrome.gcm.register([mosaicGCMSenderId], registerCallback);
    }
  });

});

function getHour() {
  return Math.floor(new Date().getTime()/1000/60/60)
}

chrome.runtime.onSuspend.addListener(function() {
  chrome.socket.destroy(upnpEventListener.socketId);
});

// Callback when a Chrome push is received
chrome.gcm.onMessage.addListener(function(message) {
  var data = message['data']
  console.log("Notification received: " + message['data']['action'])
  chrome.runtime.sendMessage({
    type: 'mosaicAction',
    action: data['action'],
    speaker: data['speaker'],
    volumn: data['volumn'],
    hour: data['hour'],
    min: data['min']
  });
});