Queue = require './queue'

MinionJob = @MinionJob =
  version: '0.0.1'
  Job: require './job'
  Queue: Queue
  utilities: require './utilities'

MinionJob.queues = require './queues'
MinionJob.queues.push ( new Queue 'default' )

module.exports = MinionJob
