const Command = require('@structures/framework/Command');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      description: 'Kicks a user.',
      options: [
        {
          type: 'USER',
          name: "member",
          description: "The member to kick.",
          required: true,
        },
        {
          type: 'STRING',
          name: "reason",
          description: "The reason for the kick.",
        },
      ]
    })
  }

  async run(ctx) {
    const user = ctx.interaction.options.getMember('member'), reason = ctx.interaction.options.getString('reason') || 'No reason provided.';
    if (!ctx.guild.me.permissions.has('KICK_MEMBERS')) return ctx.sendMsg('I do not have the `KICK_MEMBERS` permission.');

    if (!user) return ctx.sendMsg(`That user doesn't seem to be in the server.`);
    if (user.id === ctx.author.id) return ctx.sendMsg('You cannot kick yourself.');
    if (user.id === ctx.client.user.id) return ctx.sendMsg('How dare you ask me to kick myself!');
    if (user.id === ctx.guild.ownerId) return ctx.sendMsg('I cannot kick the server owner.');
    if (!user.kickable) return ctx.sendMsg('I cannot kick that user as have the same or higher role than me.');
    if (ctx.guildDb.roles.moderator && user.roles.cache.has(ctx.guildDb.roles.moderator)) return ctx.sendMsg('You cannot kick a moderator.');

    const caseId = ctx.generateCaseId();

    let sentMsg = true;
    try {
      sentMsg = true;
      await user.send({
        embeds: [
          new ctx.MessageEmbed()
            .setTitle('You were kicked')
            .setColor('PURPLE')
            .addField(`Guild`, `${ctx.guild.name.replace(/\`/, '\\`')} \`[${ctx.author.id}]\``, true)
            .addField('Moderator', `${ctx.author.tag} \`[${ctx.author.id}]\``, true)
            .addField('Reason'.slice(0, 1000), reason)
            .setFooter(`This is an automated message. | Case ID: ${caseId}`)
        ]
      })
    } catch (err) {
      sentMsg = false;
    }

    await ctx.guild.members.kick(user, { reason: `Case ID: ${caseId} | Moderator: ${ctx.author.tag} [${ctx.author.id}]` });

    let modlog = null;
    if (ctx.guildDb.logs.moderation) {
      modlog = await (await ctx.guild.channels.fetch(ctx.guildDb.logs.moderation)).send({
        embeds: [
          new ctx.MessageEmbed()
            .setAuthor(`${user.user.tag} was kicked`, user.displayAvatarURL({format:'png'}))
            .setColor('PURPLE')
            .addField('Member', `<@${user.id}> (\`${user.user.tag}\`)`, true)
            .addField('Moderator', `<@${ctx.author.id}> (\`${ctx.author.tag}\`)`, true)
            .addField('Reason'.slice(0, 1000), reason)
            .setFooter(`DM Status | Case ${caseId}`, `https://singlecolorimage.com/get/${sentMsg ? "33fd8f" : "ff2950"}/120x120`)
        ]
      }).catch((err) => null);
    }

    await ctx.database.cases.create({
      caseId, guildId: ctx.guild.id,
      moderator: { id: ctx.author.id, tag: ctx.author.tag },
      victim: { id: user.id, tag: user.user.tag },
      modlog: { 
        channelId: modlog ? modlog.channel.id : null, 
        messageId: modlog ? modlog.id : null
      },
      reason, type: 'kick',
      createdAt: new Date().toISOString(),
    });

    return ctx.sendMsg(new ctx.MessageEmbed().setDescription(`Kicked <@${user.id}> with caseId \`${caseId}\``).setColor('GREEN'));
  }
}