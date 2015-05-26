UUID = require 'node-uuid'

class Queue
  constructor: (@name) ->
    @jobs = []
    @limit = 1
    @running_jobs = []

  push_job: (job, args...) ->
    @jobs.push { uuid: UUID.v4(), job_object: job, args: args }
    @try_to_run_more()

  try_to_run_more: () ->
    return if @running_jobs.length >= @limit
    return unless poped_job = @jobs.shift()
    @running_jobs.push poped_job

    worker_blob_url = window.URL.createObjectURL poped_job.job_object.perform_worker_blob
    worker = poped_job.worker = new Worker worker_blob_url

    worker.addEventListener 'message', (e) =>
      switch e.data.msg
        when 'minion_job_done'
          @finish_job e.data.uuid
    , false

    worker.postMessage { msg: 'minion_job_start', uuid: poped_job.uuid, args: poped_job.args }

  finish_job: (uuid) ->
    @running_jobs = @running_jobs.filter (job) -> job.uuid isnt uuid
    @try_to_run_more()

module.exports = Queue
