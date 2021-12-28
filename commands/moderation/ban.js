const Command = require('@structures/framework/Command');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      description: 'Bans a user.',
      options: [
        {
          type: 'USER',
          name: "member",
          description: "The member to ban.",
          required: true,
        },
        {
          type: 'STRING',
          name: "reason",
          description: "The reason for the ban.",
        },
      ],
      access: "moderator"
    })
  }

  async run(ctx) {
    const user = ctx.interaction.options.getMember('member'), reason = ctx.interaction.options.getString('reason') || 'No reason provided.';
    if (!ctx.guild.me.permissions.has('BAN_MEMBERS')) return ctx.sendMsg('I do not have the `BAN_MEMBERS` permission.');

    if (!user) return ctx.sendMsg(`That user doesn't seem to be in the server.`);
    if (user.id === ctx.author.id) return ctx.sendMsg('You cannot ban yourself.');
    if (user.id === ctx.client.user.id) return ctx.sendMsg('How dare you ask me to ban myself!');
    if (user.id === ctx.guild.ownerId) return ctx.sendMsg('I cannot ban the server owner.');
    if (!user.bannable) return ctx.sendMsg('I cannot ban that user as have the same or higher role than me.');
    if (ctx.guildDb.roles.moderator && user.roles.cache.has(ctx.guildDb.roles.moderator)) return ctx.sendMsg('You cannot ban a moderator.');

    const bans = await ctx.guild.bans.fetch();
    if (bans.find(b => b.user.id === user.id)) return ctx.sendMsg('That user is already banned.');

    const caseId = ctx.generateCaseId();

    let sentMsg = true;
    try {
      sentMsg = true;
      await user.send({
        embeds: [
          new ctx.MessageEmbed()
            .setTitle('You were banned')
            .setColor('RED')
            .addField(`Guild`, `${ctx.guild.name.replace(/\`/, '\\`')}\n\`[${ctx.guild.id}]\``, true)
            .addField('Moderator', `${ctx.author.tag}\n\`[${ctx.author.id}]\``, true)
            .addField('Reason'.slice(0, 1000), reason)
            .setFooter(`This is an automated message. • Case ID: ${caseId}`)
        ]
      })
    } catch (err) {
      sentMsg = false;
    }

    await ctx.guild.members.ban(user, { reason: `Case ID: ${caseId} | Moderator: ${ctx.author.tag} [${ctx.author.id}]` });

    let modlog = null;
    if (ctx.guildDb.logs.moderation) {
      modlog = await (await ctx.guild.channels.fetch(ctx.guildDb.logs.moderation)).send({
        embeds: [
          new ctx.MessageEmbed()
            .setAuthor(`${user.user.tag} was banned`, user.displayAvatarURL({format:'png'}))
            .setColor('RED')
            .addField('Member', `<@${user.id}>\n(\`${user.user.tag}\`)`, true)
            .addField('Moderator', `<@${ctx.author.id}>\n(\`${ctx.author.tag}\`)`, true)
            .addField('Reason'.slice(0, 1000), reason)
            .setFooter(`DM Status • Case ${caseId}`, `https://singlecolorimage.com/get/${sentMsg ? "33fd8f" : "ff2950"}/120x120`)
        ]
      }).catch((err) => null)
    }

    await ctx.database.cases.create({
      caseId, guildId: ctx.guild.id,
      moderator: { id: ctx.author.id, tag: ctx.author.tag },
      victim: { id: user.id, tag: user.user.tag },
      modlog: { 
        channelId: modlog ? modlog.channel.id : null, 
        messageId: modlog ? modlog.id : null
      },
      reason, type: 'ban',
      createdAt: new Date().toISOString(),
    });

    return ctx.sendMsg(new ctx.MessageEmbed().setDescription(`Banned <@${user.id}> with caseId \`${caseId}\``).setColor('GREEN'));
  }
}