var irc = require('irc');
var fs = require('fs');
var _ = require('underscore');
var Handler = require('./IrcHandler');





// initiate the irc client
var client = new irc.Client('irc.bsnet.se', 'notMarvin', {
  channels: ['#johansbot'],
  userName: 'Johans bot',
  realName: 'Bot Botsson'
});

var handler = new Handler.IrcHandler(client, 'perms');




client.once('registered', function(message) {
  console.log('Registered with server, loading plugins');

  fs.readdir('./plugins', function(err, files) {
    if (err) {
      throw err;
    }

    files.forEach(function (file) {
      handler.loadPlugin(file, './plugins/' + file);
    });

  });

});




