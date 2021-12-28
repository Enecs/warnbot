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
    
    async function setupInit() {
      // Set the game as the "Watching rule breakers"
      client.user.setActivity(`rule breakers`, {type: "WATCHING"});
    }

    setupInit();
    setInterval(setupInit, 120000);

    client.punishments.load();
  }
}