var NodeBot = require('./lib/nodebot');
var BotHelper = require('./lib/helper');

var coc = require('./handlers/coc-handler');

var bot = new NodeBot('irc.bsnet.se', 'MarNot', {
  channels: ['#johansbot'],
  userName: 'Johansbot',
  realName: 'Bot Botsson',
  autoRejoin: false
});

// Simple test of middleware....
bot.use(function first(req, res, next) {
  req.stamp = 'I WAS HERE';
  next();
});


bot.on('message', /coc\s?#?[\d]+/, function(req, res) {
  if (BotHelper.startsWith(bot.nick, req.text)) {
    var match = req.text.match(/[\d]+/);
    if (!match) {
      bot.say(req.to, 'Need a coc number');
    } else {
      coc.getCoc(match[0], function(coc) {
        var msg = coc.name || coc.message;
        bot.say(req.to, msg);
      });
    }
  }
});




bot.on('message', bot.nick +': ?försvinn', function(req, res) {
  bot.leave(req.to, 'POFF!');
});

