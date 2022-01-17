const Command = require('@structures/framework/Command');
const AsciiTable = require('ascii-table');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      description: 'The main information about the bot.',
      options: [
        {
          type: 'SUB_COMMAND',
          name: 'help',
          description: "View the bot's help page.",
        },
        {
          type: 'SUB_COMMAND',
          name: 'links',
          description: "View the bot's links.",
        },
        {
          type: 'SUB_COMMAND',
          name: 'stats',
          description: "View the bot's statistics.",
        }
      ],
      access: "user"
    })
  }

  async run(ctx) {
    switch(ctx.interaction.options._subcommand) {
      case 'help': {
        const embed = new ctx.MessageEmbed()
          .setColor(ctx.client.color.primary)
          .setTitle('WarnBot - Help')
          .setDescription('A very simple, yet efficient moderation bot.')
          .addField('Features', [
            'Moderation Commands (ban, kick, warn, mute, etc)',
            'Auto-moderation (Anti-invite, anti-scams, etc)',
            'Logging (Moderation, Message Edits & Updates, etc)',
            'Case Management (View, edit, delete)',
          ].map(m=>`- ${m}`).join('\n'))
          .addField('Disclaimer', `This bot is now under new management as of <t:1639949220:R>.\nIf you have any questions, feel free to join the [support server](${ctx.client.config.supportServerInvite} "Enecs Software").`)
          .setFooter(`Requested by ${ctx.author.tag}`, ctx.author.displayAvatarURL({format: 'png'}))
        return ctx.sendMsg(embed);
      }
      case 'links': {
        const embed = new ctx.MessageEmbed()
          .setColor(ctx.client.color.primary)
          .setTitle('WarnBot - Links')
          .setDescription('Links to various resources.')
          
          .addField('Bot Invite', `[Invite Bot](${ctx.client.config.domain}/invite "Invite ${ctx.client.user.username}")`, true)
          .addField('Support Server', `[Join Server](${ctx.client.config.supportServerInvite} "Enecs Software")`, true)
          .addField('Statcord', `[View Stats](https://statcord.com/bot/${ctx.client.user.id}/ "${ctx.client.user.username} | Statcord")`, true)

          .addField('Void Bots', `[View Listing](https://voidbots.net/bot/${ctx.client.user.id}/ "Void Bots - ${ctx.client.user.username}")`, true)
          .addField('Discord Boats', `[View Listing](https://discord.boats/bot/${ctx.client.user.id}/ "Void Bots - ${ctx.client.user.username}")`, true)
          .addField('Top.gg', `[View Listing](https://top.gg/bot/${ctx.client.user.id}/ "Void Bots - ${ctx.client.user.username}")`, true)

          .setThumbnail(ctx.client.user.displayAvatarURL({format: 'png'}))
          .setFooter(`Requested by ${ctx.author.tag}`, ctx.author.displayAvatarURL({format: 'png'}))
        return ctx.sendMsg(embed);
      }
      case 'stats': {
        let os = "Unknown";
        if (process.platform) {
          const platform = process.platform, correctOs = {
            "win32": "Windows",
            "openbsd": "OpenBSD",
            "sunos": "Solaris",
            "freebsd": "FreeBSD"
          };
          os = correctOs[platform] ?? platform.toProperCase();
        }

        const table = new AsciiTable()
          .setHeading('Shard', 'Servers', 'Users', 'Ping')
          .setAlign(0, AsciiTable.CENTER)
          .setAlign(1, AsciiTable.CENTER)
          .setAlign(2, AsciiTable.CENTER)
          .setAlign(3, AsciiTable.CENTER)
        const guildCount = ctx.client.shard ? await ctx.client.shard.fetchClientValues('guilds.cache.size') : [ctx.client.guilds.cache.size];
        const ping = ctx.client.shard ? await ctx.client.shard.fetchClientValues('ws.ping') : [ctx.client.ws.ping];
        const users = ctx.client.shard ? await ctx.client.shard.broadcastEval((bot) => bot.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)) : [ctx.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)];
        guildCount.map((count, shardId) => {
          table.addRow(shardId, count.toLocaleString(), `${users[shardId].toLocaleString()}`, `${ping[shardId]}ms`)
        })
        table.addRow()
        table.addRow(`Total`, `${guildCount.reduce((servers, num) => num + servers, 0).toLocaleString()}`, `${users.reduce((users, num) => num + users, 0).toLocaleString()}`, `${Math.round(ping.reduce((users, num) => num + users, 0) / ping.length)}ms`)

        const embed = new ctx.MessageEmbed()
          .setTitle('WarnBot - Bot Information')
          .setColor(ctx.client.color.primary)
          .addField('Uptime', ctx.client.duration(ctx.client.uptime, {round:true}), true)
          .addField('User Count', `${users.reduce((users, num) => num + users, 0).toLocaleString()} users`, true)
          .addField('Server Count', `${guildCount.reduce((servers, num) => num + servers, 0).toLocaleString()} servers`, true)
          .addField('Operating System', `${os}`, true)
          .addField('Node Version', process.version, true)
          .addField('Discord.js Version', `v${ctx.client.discord.version}`, true)
          .addField('\u200b', `\`\`\`\n${table.toString()}\`\`\``, true)
          .setTimestamp()
          .setFooter(`Requested by ${ctx.author.tag}`, ctx.author.displayAvatarURL({format: 'png'}));
        return ctx.sendMsg(embed);
      }
    }
  }
}
