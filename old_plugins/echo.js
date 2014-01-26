var irc = require('irc');

module.exports = {
  'init': function(client, db, logger) {
    logger.warn('disabled to avoid multiple bot spamming eachother');
    // client.addListener('message', function(from, to, message) {
    //   client.say(to, from + ': ' + irc.colors.wrap('light_blue', message));
    // });
  }
}
