(function() {
  var Queue, UUID,
    slice = [].slice;

  UUID = require('node-uuid');

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

    Queue.prototype.try_to_run_more = function() {
      var poped_job, worker, worker_blob_url;
      if (this.running_jobs.length >= this.limit) {
        return;
      }
      this.running_jobs.push(poped_job = this.jobs.shift());
      worker_blob_url = window.URL.createObjectURL(poped_job.job_object.perform_worker_blob);
      worker = poped_job.worker = new Worker(worker_blob_url);
      worker.addEventListener('message', function(e) {
        return console.log(e.data);
      }, false);
      return worker.postMessage({
        msg: 'minion_job_start',
        uuid: poped_job.uuid,
        args: poped_job.args
      });
    };

    return Queue;

  })();

  module.exports = Queue;

}).call(this);
