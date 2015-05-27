(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
  module.exports = require('./lib/minion-job');

}).call(this);

},{"./lib/minion-job":3}],2:[function(require,module,exports){
(function() {
  var Job,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice;

  Job = (function() {
    function Job(perform_function, queue_name) {
      this.perform_function = perform_function;
      if (queue_name == null) {
        queue_name = 'default';
      }
      this.perform_later = bind(this.perform_later, this);
      this.queue = MinionJob.queues.find_or_create_by_name(queue_name);
      this.build_perform_function_worker_code();
      if (MinionJob.utilities.is_in_browser) {
        this.build_perform_function_worker_blob();
      } else {
        this.build_perform_function_worker();
      }
    }

    Job.prototype.perform_now = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this.perform_function.apply(this, args);
    };

    Job.prototype.perform_later = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this.queue.push_job(this, args);
    };

    Job.prototype.build_perform_function_worker_code = function() {
      return this.perform_function_worker_code = "var perform_function = " + this.perform_function + ";\nself.addEventListener('message', function(e) {\n  var data = e.data;\n  switch (data.msg) {\n    case 'minion_job_start':\n      var perform_promise = new Promise(function(resolve, reject){\n        perform_function.apply(self, data.args);\n        resolve();\n        // TODO reject when error occurs\n      });\n      perform_promise\n        .then(\n          function(){\n            self.postMessage({msg: 'minion_job_done', uuid: data.uuid});\n            self.close();\n          },\n          function(){}\n        )\n  }\n}, false);";
    };

    Job.prototype.build_perform_function_worker = function() {
      return this.perform_function_worker = Function(this.perform_function_worker_code);
    };

    Job.prototype.build_perform_function_worker_blob = function() {
      return this.perform_function_worker_blob = new Blob([this.perform_function_worker_code]);
    };

    return Job;

  })();

  module.exports = Job;

}).call(this);

},{}],3:[function(require,module,exports){
(function (global){
(function() {
  var MinionJob, Queue;

  Queue = require('./queue');

  MinionJob = global.MinionJob = {
    version: '0.0.1',
    Job: require('./job'),
    Queue: Queue,
    utilities: require('./utilities')
  };

  MinionJob.queues = require('./queues');

  MinionJob.queues.push(new Queue('default'));

  module.exports = MinionJob;

}).call(this);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./job":2,"./queue":4,"./queues":5,"./utilities":6}],4:[function(require,module,exports){
(function() {
  var FakeWorker, Queue, UUID,
    slice = [].slice;

  UUID = require('node-uuid');

  if (typeof window === "undefined" || window === null) {
    FakeWorker = require('webworker-threads').Worker;
  }

  Queue = (function() {
    function Queue(name) {
      this.name = name;
      this.jobs = [];
      this.limit = 1;
      this.running_jobs = [];
    }

    Queue.prototype.push_job = function() {
      var args, job;
      job = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      this.jobs.push({
        uuid: UUID.v4(),
        job_object: job,
        args: args
      });
      return this.try_to_run_more();
    };

    Queue.prototype.next_job = function() {
      var poped_job;
      if (poped_job = this.jobs.shift()) {
        return poped_job;
      } else {
        return null;
      }
    };

    Queue.prototype.run_job = function(job) {
      var worker, worker_blob_url;
      if (MinionJob.utilities.is_in_browser) {
        worker_blob_url = window.URL.createObjectURL(job.job_object.perform_function_worker_blob);
        worker = job.worker = new Worker(worker_blob_url);
      } else {
        worker = job.worker = new FakeWorker(job.job_object.perform_function_worker);
      }
      worker.addEventListener('message', (function(_this) {
        return function(e) {
          switch (e.data.msg) {
            case 'minion_job_done':
              return _this.finish_job(e.data.uuid);
          }
        };
      })(this), false);
      return worker.postMessage({
        msg: 'minion_job_start',
        uuid: job.uuid,
        args: job.args
      });
    };

    Queue.prototype.try_to_run_more = function() {
      var next_job;
      if (this.running_jobs.length >= this.limit) {
        return null;
      }
      if (!(next_job = this.next_job())) {
        return;
      }
      this.running_jobs.push(next_job);
      return this.run_job(next_job);
    };

    Queue.prototype.finish_job = function(uuid) {
      this.running_jobs = this.running_jobs.filter(function(job) {
        return job.uuid !== uuid;
      });
      return this.try_to_run_more();
    };

    return Queue;

  })();

  module.exports = Queue;

}).call(this);

},{"node-uuid":8,"webworker-threads":7}],5:[function(require,module,exports){
(function() {
  var queues;

  queues = [];

  queues.find_by_name = function(name) {
    var i, len, queue;
    for (i = 0, len = this.length; i < len; i++) {
      queue = this[i];
      if (queue.name === name) {
        return queue;
      }
    }
    return void 0;
  };

  queues.create_by_name = function(name) {
    var queue;
    queue = new MinionJob.Queue(name);
    queues.push(queue);
    return queue;
  };

  queues.find_or_create_by_name = function(name) {
    var queue;
    if ((queue = queues.find_by_name(name)) != null) {
      return queue;
    }
    return queues.create_by_name(name);
  };

  module.exports = queues;

}).call(this);

},{}],6:[function(require,module,exports){
(function() {
  var utilities;

  utilities = {
    is_in_browser: (typeof window !== "undefined" && window !== null ? true : false)
  };

  module.exports = utilities;

}).call(this);

},{}],7:[function(require,module,exports){

},{}],8:[function(require,module,exports){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

(function() {
  var _global = this;

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng;

  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
  //
  // Moderately fast, high quality
  if (typeof(_global.require) == 'function') {
    try {
      var _rb = _global.require('crypto').randomBytes;
      _rng = _rb && function() {return _rb(16);};
    } catch(e) {}
  }

  if (!_rng && _global.crypto && crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    var _rnds8 = new Uint8Array(16);
    _rng = function whatwgRNG() {
      crypto.getRandomValues(_rnds8);
      return _rnds8;
    };
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var  _rnds = new Array(16);
    _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
  }

  // Buffer class to use
  var BufferClass = typeof(_global.Buffer) == 'function' ? _global.Buffer : Array;

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // **`parse()` - Parse a UUID into it's component bytes**
  function parse(s, buf, offset) {
    var i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
      if (ii < 16) { // Don't overflow!
        buf[i + ii++] = _hexToByte[oct];
      }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
      buf[i + ii++] = 0;
    }

    return buf;
  }

  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
  function unparse(buf, offset) {
    var i = offset || 0, bth = _byteToHex;
    return  bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
  }

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  // random #'s we need to init node and clockseq
  var _seedBytes = _rng();

  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
  var _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
  ];

  // Per 4.2.2, randomize (14 bit) clockseq
  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

  // Previous uuid creation time
  var _lastMSecs = 0, _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};

    var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = options.msecs != null ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    var node = options.node || _nodeId;
    for (var n = 0; n < 6; n++) {
      b[i + n] = node[n];
    }

    return buf ? buf : unparse(b);
  }

  // **`v4()` - Generate random UUID**

  // See https://github.com/broofa/node-uuid for API details
  function v4(options, buf, offset) {
    // Deprecated - 'format' argument, as supported in v1.2
    var i = buf && offset || 0;

    if (typeof(options) == 'string') {
      buf = options == 'binary' ? new BufferClass(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ii++) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || unparse(rnds);
  }

  // Export public API
  var uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;
  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;

  if (typeof(module) != 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = uuid;
  } else  if (typeof define === 'function' && define.amd) {
    // Publish as AMD module
    define(function() {return uuid;});
 

  } else {
    // Publish as global (in browsers)
    var _previousRoot = _global.uuid;

    // **`noConflict()` - (browser only) to reset global 'uuid' var**
    uuid.noConflict = function() {
      _global.uuid = _previousRoot;
      return uuid;
    };

    _global.uuid = uuid;
  }
}).call(this);

},{}]},{},[1]);
