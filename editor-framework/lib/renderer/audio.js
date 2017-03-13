'use strict';

const EventEmitter = require('events');

// NOTE: based on http://creativejs.com/resources/web-audio-api-getting-started/
// we can keep an AudioContext, don't worry about AudioContext.close() for releasing it.
let _audioContext;
let _volumeNode;

let _sessionIds = {};
let _curSessionID = 1000;

// ========================================
// exports
// ========================================

class AudioControl extends EventEmitter {
  constructor () {
    super();

    this._currentAudioSource = null;
    this._buffer = null;
    this._played = 0;
    this._started = false;
    this._state = 'stopped';

    this.loop = false;
    this.playbackRate = 1.0;
    this.volume = 1.0;
  }

  state () { return this._state; }

  play ( at ) {
    at = at || 0;

    if ( this._started ) {
      this._reset(this._buffer);
    }

    this._timestamp = _audioContext.currentTime;
    this._played = at;
    this._started = true;
    this._currentAudioSource.start( 0, at );

    this._state = 'playing';
    this.emit('started');
  }

  stop () {
    if ( this._state === 'paused' ) {
      this._state = 'stopped';
      this._played = 0;
      this.emit('ended');

      return;
    }

    if ( !this._currentAudioSource ) {
      return;
    }

    if ( !this._started ) {
      return;
    }

    let audioSource = this._currentAudioSource;
    audioSource.stop(0);
    audioSource.onended = null;
    this._currentAudioSource = null;

    this._state = 'stopped';
    this._played = 0;
    this.emit('ended');
  }

  pause () {
    if ( !this._currentAudioSource ) {
      return;
    }

    if ( !this._started ) {
      return;
    }

    this._played = this.time();

    let audioSource = this._currentAudioSource;
    audioSource.stop(0);
    audioSource.onended = null;
    this._currentAudioSource = null;

    this._state = 'paused';
    this.emit('paused');
  }

  resume () {
    this.play(this._played);
  }

  length () {
    return this._buffer.length;
  }

  buffer () {
    return this._buffer;
  }

  time () {
    if ( this._state === 'paused' ) {
      return this._played;
    }

    if ( this._state === 'playing' ) {
      return (_audioContext.currentTime - this._timestamp) * this.playbackRate + this._played;
    }

    return 0;
  }

  mute ( mute ) {
    _volumeNode.gain.value = mute ? -1 : this.volume;
  }

  // range [0,1]
  setVolume ( val ) {
    this.volume = val;
    _volumeNode.gain.value = val;
  }

  //
  setLoop ( val ) {
    this.loop = val;
    if ( this._currentAudioSource ) {
      this._currentAudioSource.loop = val;
    }
  }

  //
  setPlaybackRate ( val ) {
    this.playbackRate = val;

    if ( this._currentAudioSource ) {
      this._currentAudioSource.playbackRate.value = val;

      if ( this._state !== 'paused' ) {
        this.pause();
        this.play();
      }
    }
  }

  _reset ( buffer ) {
    this.stop();

    let audioSource = _audioContext.createBufferSource();

    audioSource.buffer = buffer;
    audioSource.loop = this.loop;
    audioSource.playbackRate.value = this.playbackRate;
    audioSource.connect(_volumeNode);
    audioSource.onended = () => {
      this.stop();
    };

    this._currentAudioSource = audioSource;
    this._buffer = buffer;
    this._started = false;
    this._startAt = 0;
    this._state = 'stopped';
  }
}

let EditorAudio = {
  context () {
    if ( !_audioContext ) {
      _audioContext = new window.AudioContext();
      _volumeNode = _audioContext.createGain();
      _volumeNode.gain.value = 1;
      _volumeNode.connect(_audioContext.destination);
    }
    return _audioContext;
  },

  load ( url, cb ) {
    function _ready ( ctx, response ) {
      ctx.decodeAudioData(
        response,
        buffer => {
          let ctrl = new AudioControl();
          ctrl._reset(buffer);

          if ( cb ) {
            cb ( null, ctrl );
          }
        },
        e => {
          if ( cb ) {
            cb ( e.err );
          }
        }
      );
    }

    let xhr = new window.XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onreadystatechange = e => {
      if (xhr.readyState !== 4) {
        return;
      }

      // Testing harness file:/// results in 0.
      if ([0, 200, 304].indexOf(xhr.status) === -1) {
        delete _sessionIds[xhr._session];

        throw new Error(
          `While loading from url ${url} server responded with a status of ${xhr.status}`
        );
      }

      // if the session canceled, don't return the callback
      if ( _sessionIds[xhr._session] ) {
        delete _sessionIds[xhr._session];
        _ready( this.context(), e.target.response );
      }
    };

    xhr._session = _curSessionID;
    _sessionIds[_curSessionID] = xhr;
    ++_curSessionID;

    xhr.send();

    return xhr._session;
  },

  cancel ( sessionId ) {
    let xhr = _sessionIds[sessionId];
    if ( xhr ) {
      delete _sessionIds[sessionId];
      xhr.onreadystatechange = null;
      xhr.abort();
    }
  },
};

module.exports = EditorAudio;
