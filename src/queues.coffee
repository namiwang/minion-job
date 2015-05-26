queues = []

queues.find_by_name = (name) ->
  for queue in this
    return queue if queue.name is name
  return undefined

queues.create_by_name = (name) ->
  queue = new MinionJob.Queue name
  queues.push queue
  return queue

queues.find_or_create_by_name = (name) ->
  return queue if ( queue = queues.find_by_name name )?
  return queues.create_by_name name

module.exports = queues
