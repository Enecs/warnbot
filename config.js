const private = require('./config-private');

module.exports = {
  // Bot Token
  token: private.token,
  
  // Bot Administators (Access to Admin Dash & System Commands)
  admins: ['209796601357533184', '229285505693515776'],

  // Database Crap (MongoDB & Redis)
  mongo_uri: private.mongo_uri,
  redis: {
    host: private.redis.host,
    port: private.redis.port ?? 6379,
    prefix: "WB:"
  },
  
  // Support server. (For the "dashboard.example/join")
  supportServerInvite: "https://discord.gg/KkS6yP8",
  
  // Domain (Used for Auth, RestApi & Links)
  domain: "https://warnbot.enx.so",

  // Rest Api
  restapi: {
    secret: private.restapi.secret,
    port: private.restapi.port ?? 80,
    oauth: {
      client_secret: private.restapi.oauth.client_secret
    }
  },

  // Bot Logging
  webhooks: private.webhooks,
  statcordKey: private.statcordKey,
}