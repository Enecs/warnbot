const Command = require('@structures/framework/Command');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      description: 'Bans a user.',
      options: [
        {
          type: 'USER',
          name: "user",
          description: "The user to unban.",
          required: true,
        },
        {
          type: 'STRING',
          name: "reason",
          description: "The reason for the unban.",
        },
      ]
    })
  }

  async run(ctx) {
    const user = ctx.interaction.options.getUser('user'), reason = ctx.interaction.options.getString('reason') || 'No reason provided.';
    if (!ctx.guild.me.permissions.has('BAN_MEMBERS')) return ctx.sendMsg('I do not have the `BAN_MEMBERS` permission.');

    if (user.id === ctx.author.id) return ctx.sendMsg('How can you be banned if you ran this command?');
    if (user.id === ctx.client.user.id) return ctx.sendMsg(`These commands wouldn't exist if I wasn't here.`);

    const bans = await ctx.guild.bans.fetch();
    if (!bans.find(b => b.user.id === user.id)) return ctx.sendMsg('That user is not banned.');

    const caseId = ctx.generateCaseId();

    await ctx.guild.members.unban(user, { reason: `Case ID: ${caseId} | Moderator: ${ctx.author.tag} [${ctx.author.id}]` });

    let modlog = null;
    if (ctx.guildDb.logs.moderation) {
      modlog = await (await ctx.guild.channels.fetch(ctx.guildDb.logs.moderation)).send({
        embeds: [
          new ctx.MessageEmbed()
            .setAuthor(`${user.tag} was unbanned`, user.displayAvatarURL({format:'png'}))
            .setColor('GREEN')
            .addField('Member', `<@${user.id}>\n(\`${user.tag}\`)`, true)
            .addField('Moderator', `<@${ctx.author.id}>\n(\`${ctx.author.tag}\`)`, true)
            .addField('Reason'.slice(0, 1000), reason)
            .setFooter(`Case ${caseId}`)
        ]
      }).catch((err) => null)
    }
    
    await ctx.database.cases.create({
      caseId, guildId: ctx.guild.id,
      moderator: { id: ctx.author.id, tag: ctx.author.tag },
      victim: { id: user.id, tag: user.tag },
      modlog: { 
        channelId: modlog ? modlog.channel.id : null, 
        messageId: modlog ? modlog.id : null
      },
      reason, type: 'unban',
      createdAt: new Date().toISOString(),
    });

    return ctx.sendMsg(new ctx.MessageEmbed().setDescription(`Unbanned <@${user.id}> with caseId \`${caseId}\``).setColor('GREEN'));
  }
}