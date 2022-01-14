const Event = require('@structures/framework/Event');
module.exports = class extends Event {
  constructor(client) {
    super(client, {
      enabled: true,
    })
  }

  async run (client) {
    console.log(`Loaded as ${client.user.tag} (${client.user.id})`);

    // await client.application.commands.set(client.commands.map(m => m.commandData));
    
    // Setup the website.
    if(!client.shard || !client.shardId) {
      client.site = new (require("@structures/restapi/index.js"))(client);
      client.site.listen(client.config.restapi.port);
    }

    async function setupInit() {
      // Set the game as the "Watching rule breakers"
      client.user.setActivity(`rule breakers`, {type: "WATCHING"});
    }

    setupInit();
    setInterval(setupInit, 120000);

    client.punishments.load();
  }
}