(function(module, undefined) {
  'use strict';
  module.exports = {
    'join': {
      // channels: ['#test'],
      'match': [
        /^dbwebb_/i,
        'harald'
      ],
      handler: function(channel, nick, message) {
        return {
          'to': channel,
          'message': nick + " joined ze channel! WELCOME!"
        };
      }
    }
  };
})(module);
