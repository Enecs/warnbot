const Event = require('@structures/framework/Event');
module.exports = class extends Event {
  constructor(client) {
    super(client, {
      enabled: true,
    })
  }

  async run (client, id, unavailableGuilds) {
    client.shardId = id;
  }
}