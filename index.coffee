if window?
  window.MinionJob = require './lib/minion-job'
else
  module?.exports = require './lib/minion-job'
