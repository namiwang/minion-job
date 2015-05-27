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
