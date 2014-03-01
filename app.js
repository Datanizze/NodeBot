var NodeBot = require('./lib/nodebot');
var BotHelper = require('./lib/helper');

var config = require('./config');

var CocHandler = require('./handlers/coc-handler');

var handlers = {};

handlers.coc = new CocHandler(config.cocs.cacheTime);

// TODO: move to external config
var bot = new NodeBot(config.server, config.nick, config.options);

bot.use(require('./middlewares/channel-parser'));


bot.on('message', /coc\s?#?[\d]+/, function(req, res) {
  if (BotHelper.startsWith(bot.nick, req.text)) {
    var match = req.text.match(/[\d]+/);
    if (!match) {
      bot.say(req.to, 'Need a coc number');
    } else {
      handlers.coc(match[0], function(coc) {
        var msg = coc.name || coc.message;
        bot.say(req.to, msg);
      });
    }
  }
});

var pattern = /(?:(https?|ftp):\/\/)?(?:((?:[^\W\s]|\.|-|[:]{1})+)@{1})?((?:www.)?(?:[^\W\s]|\.|-)+[\.][^\W\s]{2,4}|localhost(?=\/)|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d*))?([\/]?[^\s\?]*[\/]{1})*(?:\/?([^\s\n\?\[\]\{\}\#]*(?:(?=\.)){1}|[^\s\n\?\[\]\{\}\.\#]*)?([\.]{1}[^\s\?\#]*)?)?(?:\?{1}([^\s\n\#\[\]]*))?([\#][^\s\n]*)?/i;
bot.on('message', pattern, function(req, res) {
  console.log('URL MSG MATCHER');
  var matches = req.text.match(pattern);
  var orgUrl = matches[0];
  var url = orgUrl;
  // does the url start with /https?/ ?, if not add http://
  if (!/https?:\/\//i.test(url)) {
    url = 'http://' + orgUrl;
  }

  console.log(url);
  // send it in to the title handle, will silently fail (console.log however will be present!)
  tittle.getTitle(url, function(title) {
    if (title) {
      if (title.length>128) {
        title = title.substr(0, 126) + '...';
      }
      var snippedUrl = orgUrl;
      if (orgUrl.length > 20) {
        snippedUrl = '...' + orgUrl.substr(orgUrl.length-12);
      }
      bot.say(req.to, snippedUrl + ': ' + title);
    }
  });
});


bot.on('message', bot.nick +': ?leave', function(req, res) {
  bot.leave(req.to, 'test');
});


bot.on('message', 'join', function(req, res) {
  if (BotHelper.startsWith(bot.nick, req.text)) {
    var joinIndex = req.text.indexOf('join');
    var text = req.text.substr(joinIndex+4).trim();
    console.log(joinIndex, text, req.text);
    var channelPattern = /[#?!&][^\s,]{1,50}/i;
    var matches = text.match(channelPattern);
    bot.say(req.to, 'I should join ' + matches[0]);
  }
})
;
