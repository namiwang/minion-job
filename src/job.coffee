class Job
  constructor: (@perform_function, queue_name = 'default') ->
    @queue = MinionJob.queues.find_or_create_by_name queue_name
    @build_perform_function_worker_code()
    if MinionJob.utilities.is_in_browser
      @build_perform_function_worker_blob()
    else
      @build_perform_function_worker()

  perform_now: (args...) ->
    @perform_function.apply this, args

  perform_later: (args...) =>
    @queue.push_job this, args

  build_perform_function_worker_code: () ->
    @perform_function_worker_code =
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

  build_perform_function_worker: () ->
    @perform_function_worker = Function @perform_function_worker_code

  build_perform_function_worker_blob: ->
    @perform_function_worker_blob = new Blob [ @perform_function_worker_code ]

module.exports = Job
