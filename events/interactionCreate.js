const Event = require('@structures/framework/Event');
const Context = require('@structures/framework/Context');

module.exports = class extends Event {
  constructor(client) {
    super(client, {
      enabled: true,
    })
  }

  async run (client, interaction) {
    let guildDb = await client.database.guilds.findOne({ guildId: interaction.guild.id });
    if (!guildDb) guildDb = await client.database.guilds.create({ guildId: interaction.guild.id });

    if(interaction.isAutocomplete() || interaction.isCommand()) {
      let cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      const ctx = new Context({ client, interaction, guildDb });
      if(interaction.isAutocomplete()) return cmd._autoComplete(ctx);
      if(interaction.isCommand()) return cmd._run(ctx);
    }
  }
}