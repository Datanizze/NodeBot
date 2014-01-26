module.exports = function(ircHandler) {
  'use strict';

  var self = this;
  self.ircHandler = ircHandler;
  console.log('RELOADER: Plugin loaded');

  return {
    'message': {
      'match': /reload/i,
      'handler': function(from, to, message) {
        self.ircHandler.reloadPlugin('example.js');
      }
    }
  };
};
