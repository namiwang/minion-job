Queue = require './queue'

MinionJob = global.MinionJob = 
  version: '0.0.2'
  Job: require './job'
  Queue: Queue
  utilities: require './utilities'

MinionJob.queues = require './queues'
MinionJob.queues.push ( new Queue 'default' )

module.exports = MinionJob
