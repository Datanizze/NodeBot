module.exports = function(ircHandler) {
  'use strict';

  var self = this;
  self.ircHandler = ircHandler;
  console.log('EXAMPLE: Plugin loaded');

  return {
    'join': {
      // channels: ['#test'],
      'match': [
        /^pelle/i
      ],
      'handler': function(channel, nick, message) {
        return {
          'to': channel,
          'message': nick + " joined the channel! WELCOME!"
        };
      }
    },
    'message': {
      // 'match': [],
      'handler': function(from, to, message) {
      }
    }
  };
};
