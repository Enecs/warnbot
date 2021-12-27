const Command = require('@structures/framework/Command');
const AsciiTable = require('ascii-table');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      description: 'Get information about the bot.',
      options: []
    })
  }

  async run(ctx) {
    let os = "Unknown";
    if (process.platform) {
      const platform = process.platform;
      if (platform === 'win32') os = 'Windows';
      else if (platform === 'aix') os = 'Aix';
      else if (platform === 'linux') os = 'Linux';
      else if (platform === 'darwin') os = 'Darwin';
      else if (platform === 'openbsd') os = 'OpenBSD';
      else if (platform === 'sunos') os = 'Solaris';
      else if (platform === 'freebsd') os = 'FreeBSD';
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
      .setTitle('Bot Info')
      .setColor(ctx.client.color.primary)
      .addField('Uptime', ctx.client.duration(ctx.client.uptime, {round:true}), true)
      .addField('User Count', `${users.reduce((users, num) => num + users, 0).toLocaleString()} users`, true)
      .addField('Server Count', `${guildCount.reduce((servers, num) => num + servers, 0).toLocaleString()} servers`, true)
      .addField('Operating System', `${os}`, true)
      .addField('Node Version', process.version, true)
      .addField('Discord.js Version', `v${ctx.client.discord.version}`, true)
      .addField('\u200b', `\`\`\`\n${table.toString()}\`\`\``, true)
      .setTimestamp()
      .setFooter(ctx.author.username, ctx.author.avatarURL());
    ctx.sendMsg(embed);
  }
}