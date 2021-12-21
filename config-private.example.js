module.exports = {
  token: "YOUR_DISCORD_BOT_TOKEN",
  mongo_uri: "MONGODB_URI",
  redis: {
    host: "REDIS_HOST",
    port: 6379, // The default redis port is 6379
  },
  webhooks: [
    { name: "shard", id: "", token: "" },
    { name: "error", id: "", token: "" },
    { name: "command", id: "", token: "" },
    { name: "guilds", id: "", token: "" },
  ]
}