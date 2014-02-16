var NodeBot = require('./lib/nodebot');

var bot = new NodeBot('irc.bsnet.se', 'notMarvin', {
  channels: ['#johansbot'],
  userName: 'Johansbot',
  realName: 'Bot Botsson',
  autoRejoin: false
});


bot.use(function first(req, res, next) {
  req.stamp = 'I WAS HERE';
  // console.log('next', next);
  next();
});


bot.on('message', new RegExp('^!'), function(req, res) {
  console.log('REQ:', req);
  console.log('RES:', res);
  bot.say(req.to, req.from + ' SAID: ' + req.text);
});
