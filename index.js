(function() {
  if (typeof window !== "undefined" && window !== null) {
    window.MinionJob = require('./lib/minion-job');
  } else {
    if (typeof module !== "undefined" && module !== null) {
      module.exports = require('./lib/minion-job');
    }
  }

}).call(this);
