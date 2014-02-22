# NodeBot

This fine piece of code contains a small (and currenctly incomplete) wrapper around node-irc.
The mission of this code is to learn and if all goes well have a nice bot to use.

## Installation

### Prerequisites
* node (+npm)
* mongodb

### Procedure

* Clone this repo
* enter repo directory
* `npm install`
* change app.js config (since config hardcoded there at the moment)
* start with `node app`

## What can it do?

He can't do much right now but here is the gist:

* Invite:able, invite him to a channel and he will join. (should probably move that away from the wrapper)
* Parts on que, tell him to leave and he will leave.
* code of conduct, shows CoC from http://dbwebb.se/coc.

## Handlers

### CoC Handler

Uses http://dbwebb.se/coc as a simple API.
When called, given a coc id, it checks for the coc in a local mongodb collection.
if exists, the timestamp of the coc is checked. If the timestamp is within the cache period
the coc is returned as is. If the cache time has elapsed, the coc is fetched from dbwebb and saved to the database.
The procedure is the same if the coc doesn't exist in the local database.

example usage:
```JavaScript
  var CocHandler = require('./lib/coc-handler');

  var coc = new CocHandler(3600); // specify cache time in seconds
  //          random number 1-10 // only 8 cocs exist (as of this writing), set it to 10 to show possibility and handling of nonexistent cocs.
  coc(Math.floor(Math.random()*10),callback(coc) {
    // coc will be the returned code of conduct
    // if the coc exists it will have a name and a description
    // if it doesn't, it will have a message (telling us it doesn't exist)
    console.log(coc.name || coc.message);
  })
```
