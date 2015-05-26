(function() {
  var utilities;

  utilities = {
    is_in_browser: (typeof window !== "undefined" && window !== null ? true : false)
  };

  module.exports = utilities;

}).call(this);
