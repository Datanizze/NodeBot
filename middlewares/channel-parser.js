// just parse the message and add any valid channels to the request

var channelPattern = /[#?!&][^\s,]{1,50}/gi;

module.exports = function(req, res, next) {
  req.mentions = req.mentions || {};
  req.mentions.channels = {};
  while ((match = channelPattern.exec(req.text)) !== null) {
    req.mentions.channels[match.index] = match[0];
  }
  next();
};
