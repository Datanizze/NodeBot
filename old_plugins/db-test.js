'use strict';

var _ = require('underscore');

var client;
var mongoose;
var logger;

var models = {};

function initModel() {
  models['cat'] = mongoose.model('Cat', { name: String });
}

function handleMessage(to, message) {
  var msg = message.split(' ');
  console.log('SPLITTED MESSAGE:', msg);

  if (msg[0].toLowerCase() === 'cat') {
    var command = msg[1];

    switch (command) {
      case 'add':
        var catName = msg.splice(2);
        logger.info('Adding cat => ' + catName);
        var kitty = new models['cat']({
          name: catName
        });

        kitty.save(function (err) {
          if (err) {
            console.log(error);
            logger.error(err);
          }
          logger.info(catName + ' SAVED!');
        });
        break;
      case 'remove':
        logger.warn('Command not implemented');
        break;
      case 'show':
        logger.warn('Command not implemented');
      case 'list':
        models['cat'].find(function(err, cats) {
          if (err) {
            console.log(err);
            logger.error(err);
          }
          var kitties = [];
          _.each(cats, function(cat) {
            kitties.push(cat.name);
          });
          kitties = kitties.join(', ');
          client.say(to, 'I take care of ' + kitties);
        });
        break;
      default:
        logger.error('Kitty doesn\'t mjau to that');
        logger.log('(Should show available commands here...');
        break;
    }
  }

}

function addCatListener() {
  client.addListener('message', function(from, to, message) {
    handleMessage(to, message);
  });
}


module.exports = {
  'init': function(irc, db, log) {
    client = irc;
    mongoose = db;
    logger = log;

    log.log('Initiating database model');
    initModel();
    addCatListener();

  }

}
