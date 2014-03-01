// See https://node-irc.readthedocs.org/en/latest/API.html#client for node-irc's options
module.exports = {
  server: '',
  nick: '',
  options: {
    channels: [],
    userName: '',
    realName: '',
    autoRejoin: false,
    // debug: true,
    // floodProtection: true,
    floodProtectionDelay: 256,
  },
  cocs: {
    cacheTime: 6 * 60 * 60, // 6 hours
    baseUrl: 'http://dbwebb.se/coc',
    mongo: {
      host: 'localhost',
      port: '', // 27017 is default
      username: '',
      password: '',
      database: 'wip-cocs',
      collection: 'real-cocs'
    }
  }
};
