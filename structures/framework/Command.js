module.exports = class Command {
  constructor(client, options) {
    this.client = client;
    this.location = null;
    this.fileName = null;
    this.enabled = "enabled" in options ? options.enabled : true;
    this.access = options.access;
    
    this.commandData = {
      name: null,
      description: options.description,
      options: options.options,
      defaultPermissions: options.defaultPermissions,
    }
  }

  // This function will run everytime the command name is ran with proper prefix
  run(ctx) {
    throw new Error('Command run method not implemented');
  }

  // This function will fire when the command has an option with the flag autocomplete.
  autoComplete(ctx) {
    return [];
  }

  // This function will fire on command unload (when reloaded)
  shutdown() { return true; }

  // Error Catching Functions
  async _autoComplete(ctx) {
    try {
      const value = await this.autoComplete(ctx);
      ctx.interaction.respond(value);
    } catch (err) {
      console.error(err);
      ctx.client.webhooks.error.send(`**${ctx.client.user.username} - Command Autocomplete Error:**\n\`\`\`\n${err.stack}`.slice(0,1995)+'\`\`\`')
      ctx.interaction.respond([]);
    }
  }

  async _run(ctx) {
    await ctx.interaction.deferReply();
    ctx.client.webhooks.command.send({content: `${ctx.author.tag} \`${ctx.author.id}\` used **${ctx.interaction.commandName}** in ${ctx.interaction.guild.name} \`${ctx.interaction.guild.id}\` ||/${ctx.interaction.commandName}${ctx.interaction.options._subcommand?` ${ctx.interaction.options._subcommand} `:''} ${ctx.interaction.options._hoistedOptions.map(m => `${m.name}:${m.value}`).join(' ')}`.slice(0,1995)+'||', allowedMentions: { parse: [] } })
    ctx.client.statcord.ShardingClient.post(ctx.interaction.commandName, ctx.author.id, ctx.client);
    try {
      await this.run(ctx);
    } catch (err) {
      console.error(err);
      ctx.client.webhooks.error.send(`**${ctx.client.user.username} - Command Error:**\n\`\`\`\n${err.stack}`.slice(0,1995)+'\`\`\`')
      ctx.sendMsg(new ctx.MessageEmbed()
        .setTitle('Oops')
        .setColor(ctx.color.error)
        .setDescription(`The error that occured has been logged into our systems. If this is repeative, report it to DanPlayz#7757 at <${ctx.client.config.supportServerInvite}>.\n\`\`\`js\n${err.message}\`\`\``),
        { components: [] })
    }
  }
}