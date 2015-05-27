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
