class Job
  constructor: (@perform_function, queue_name = 'default') ->
    @queue = MinionJob.queues.find_or_create_by_name queue_name
    @build_blob()

  perform_now: (args...) ->
    @perform_function.apply this, args

  perform_later: (args...) =>
    @queue.push_job this, args

  build_blob: ->
    worker_for_job_code = 
    """
    var perform_function = #{@perform_function};
    self.addEventListener('message', function(e) {
      var data = e.data;
      switch (data.msg) {
        case 'minion_job_start':
          var perform_promise = new Promise(function(resolve, reject){
            perform_function.apply(self, data.args);
            resolve();
            // TODO reject when error occurs
          });
          perform_promise
            .then(
              function(){
                self.postMessage({msg: 'minion_job_done', uuid: data.uuid});
                self.close();
              },
              function(){}
            )
      }
    }, false);
    """
    @perform_worker_blob = new Blob [worker_for_job_code]

module.exports = Job
