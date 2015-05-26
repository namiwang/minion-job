(function() {
  var queues;

  queues = [];

  queues.find_by_name = function(name) {
    var i, len, queue;
    for (i = 0, len = this.length; i < len; i++) {
      queue = this[i];
      if (queue.name === name) {
        return queue;
      }
    }
    return void 0;
  };

  queues.create_by_name = function(name) {
    var queue;
    queue = new MinionJob.Queue(name);
    queues.push(queue);
    return queue;
  };

  queues.find_or_create_by_name = function(name) {
    var queue;
    if ((queue = queues.find_by_name(name)) != null) {
      return queue;
    }
    return queues.create_by_name(name);
  };

  module.exports = queues;

}).call(this);
