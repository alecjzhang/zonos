function SpeakerController(registrationId) {
  this.registrationId = registrationId;
  this.googleUrl = 'https://android.googleapis.com/gcm/send';
  this.headers = {"Content-Type": "application/json", "Authorization": "key=AIzaSyChwMmgjru6alcZ83jssDgV7daHu0zuuME"};
}

SpeakerController.prototype.action = function(action, extraData) {
  var data = {'registration_ids' : [this.registrationId], 'data': {'action': action}};
  for (var key in extraData) {
    data['data'][key] = extraData[key]
  }
  $.ajax({
    type: "POST",
    url: this.googleUrl,
    headers: this.headers,
    data: JSON.stringify(data),
    success: function(a){console.log(a)},
    dataType: "application/x-www-form-urlencoded"
  });
  return false;
};

SpeakerController.prototype.play = function() {
  this.action('Play');
};

SpeakerController.prototype.pause = function() {
  this.action('Pause');
};

SpeakerController.prototype.next = function() {
  this.action('Next');
};

SpeakerController.prototype.previous = function() {
  this.action('Previous');
};

SpeakerController.prototype.mute = function() {
  this.action('SetVolume', {'volume':0});
};

SpeakerController.prototype.volume = function(volume) {
  this.action('SetVolume', {'volume':volume});
};

SpeakerController.prototype.shuffle = function() {
  this.action('Shuffle');
};

SpeakerController.prototype.repeatAll = function() {
  this.action('RepeatAll');
};

SpeakerController.prototype.sleep = function(min) {
  this.action('Sleep', {'min':min});
};

SpeakerController.prototype.status = function(callbackUrl) {
  this.action('Status', {'callbackUrl': callbackUrl});
};