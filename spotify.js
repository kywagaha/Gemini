var SpotifyWebApi = require('spotify-web-api-js');
var $ = require('jquery');
var spotifyApi = new SpotifyWebApi();
const update_ms = 5000;
var mySong;
var firstUpdate = true;

  var myCode;
  $.ajax({async: false, url: 'http://localhost:8080/mycode', type: 'GET', success: function(data){myCode = data;}});
  var token = function getToken() {
    return $.ajax({
      async: false,
      url: 'https://accounts.spotify.com/api/token',
      data: {
        'redirect_uri': 'http://localhost:8080/callback',
        'client_id': myCode.client_id,
        'client_secret': myCode.client_secret,
        'grant_type': 'authorization_code',
        'code': myCode.authorization
      },
      type: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
        },
      success: function(data){
        return data;
      },
    });
  }();
  spotifyApi.setAccessToken(token.responseJSON.access_token);

  function update(){
    spotifyApi.getMyCurrentPlayingTrack()
    .then(function(data) {
      if (data != ""){
        if (firstUpdate == false) {
          if (mySong != data.item.name) {
            document.getElementById("song").innerHTML = data.item.name;
            document.getElementById("artist").innerHTML = data.item.artists[0].name;
            document.body.style.backgroundImage = 'url('+data.item.album.images[0].url+')';
          };
        }
        else {
          document.getElementById("song").innerHTML = data.item.name;
          document.getElementById("artist").innerHTML = data.item.artists[0].name;
          document.body.style.backgroundImage = 'url('+data.item.album.images[0].url+')';
        };
        
        console.log('Now playing', data);
        var remaining_ms = data.item.duration_ms - data.progress_ms;
        if (remaining_ms < update_ms) {
          setTimeout(update, remaining_ms);
          console.log('Predicting track skip in ' + remaining_ms);
        };
        firstUpdate = false;
        mySong = data.item.name;
      }
      else {
        document.getElementById("song").innerHTML = 'No track loaded';
        document.getElementById("artist").innerHTML = 'please play a track';
        console.log('No loaded track found');
        mySong = null;
      };
    }, function(err) {
      console.log(err.status);
      if (err.status == 401) {
        document.getElementById("song").innerHTML = "API token out of date";
        document.getElementById("artist").innerHTML = "please close and restart the app";
      };
    }); 
  
  };
  update();
  setInterval(update, update_ms);

  var timer;

  function xCoords(event) {
    var x = event.clientX;
    return x;
  };

  var firing = false;
  var singleClick = function(){
    spotifyApi.getMyCurrentPlayingTrack()
      .then(function(data) {
      var isPlaying = data.is_playing;
      if (isPlaying == true){
        spotifyApi.pause();
        console.log('Pausing music');
      }
      else if (isPlaying == false){
        spotifyApi.play();
        console.log('Playing music');
      }
      else {
        console.log('No track loaded');
      };
    });
  };

  var doubleClickFwd = function(){
    console.log('Skipping forward');
    spotifyApi.skipToNext();
    setTimeout(update, 400); 
  };
  var doubleClickBkwd = function(){
    console.log('Skipping backward');
    setTimeout(update, 400); 
    spotifyApi.skipToPrevious();
  };

  var firingFunc = singleClick;

  window.onclick = function() {
    if(firing) 
      return;

    firing = true;
    timer = setTimeout(function() { 
      firingFunc(); 

      firingFunc = singleClick;
      firing = false;
    }, 300);

  };

  window.ondblclick = function() {
    if (xCoords(event) < 200) {
      firingFunc = doubleClickBkwd;
    }      
    else {
      firingFunc = doubleClickFwd;
    };
  };


$(document).ready(function() { 
  var idleMouseTimer;
  var forceMouseHide = false;
  $("body").css('cursor', 'none');
  $("body").mousemove(function(ev) {
    if(!forceMouseHide) {
      $("body").css('cursor', '');
      clearTimeout(idleMouseTimer);
      idleMouseTimer = setTimeout(function() {
        $("body").css('cursor', 'none');
        forceMouseHide = true;
        setTimeout(function() {
          forceMouseHide = false;
        }, 200);
      }, 1000);
    };
  });
});