UUID = require 'node-uuid'
# unless MinionJob.utilities.is_in_browser
# at this time, MinionJob.utilities.is_in_browser is still not available
unless window?
  FakeWorker = require('webworker-threads').Worker

class Queue
  constructor: (@name) ->
    @jobs = []
    @limit = 1
    @running_jobs = []

  push_job: (job, args...) ->
    @jobs.push { uuid: UUID.v4(), job_object: job, args: args }
    @try_to_run_more()

  next_job: () ->
    if poped_job = @jobs.shift()
      return poped_job
    else
      return null

  run_job: (job) ->
    if MinionJob.utilities.is_in_browser
      worker_blob_url = window.URL.createObjectURL job.job_object.perform_function_worker_blob
      worker = job.worker = new Worker worker_blob_url
    else
      worker = job.worker = new FakeWorker job.job_object.perform_function_worker

    worker.addEventListener 'message', (e) =>
      switch e.data.msg
        when 'minion_job_done'
          @finish_job e.data.uuid
    , false

    worker.postMessage { msg: 'minion_job_start', uuid: job.uuid, args: job.args }

  try_to_run_more: () ->
    return null if @running_jobs.length >= @limit
    return unless next_job = @next_job()
    @running_jobs.push next_job
    @run_job next_job

  finish_job: (uuid) ->
    @running_jobs = @running_jobs.filter (job) -> job.uuid isnt uuid
    @try_to_run_more()

module.exports = Queue
