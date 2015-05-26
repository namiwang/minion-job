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
    @running_jobs.push poped_job = @jobs.shift()

    worker_blob_url = window.URL.createObjectURL poped_job.job_object.perform_worker_blob
    worker = poped_job.worker = new Worker worker_blob_url

    worker.addEventListener 'message', (e) ->
      console.log e.data
    , false

    worker.postMessage { msg: 'minion_job_start', uuid: poped_job.uuid, args: poped_job.args }

module.exports = Queue
