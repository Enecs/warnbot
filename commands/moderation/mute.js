const Command = require('@structures/framework/Command');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      description: 'Mute a user.',
      options: [
        {
          type: 'USER',
          name: "user",
          description: "The user to mute.",
          required: true,
        },
        {
          type: 'STRING',
          name: "time",
          description: "The amount of time the user should be muted for.",
          required: true,
        },
        {
          type: 'STRING',
          name: "reason",
          description: "The reason for the mute.",
        },
      ],
      access: "moderator"
    })
  }

  async run(ctx) {
    const user = ctx.interaction.options.getMember('user'), reason = ctx.interaction.options.getString('reason') || 'No reason provided.';
    if (!ctx.guild.me.permissions.has('MANAGE_ROLES')) return ctx.sendMsg('I do not have the `MANAGE_ROLES` permission.');
    if (!ctx.guildDb.roles.muted) return ctx.sendMsg(`Please setup the muted role using \`/configure role type:muted\``);

    if (user.id === ctx.author.id) return ctx.sendMsg('Why would you mute yourself?');
    if (user.id === ctx.client.user.id) return ctx.sendMsg(`I can't respond while muted.`);
    if (user.id === ctx.guild.ownerId) return ctx.sendMsg(`Even if I muted the owner, they would still be able to respond.`);
    if (ctx.guild.members.cache.get(user.id).roles.cache.has(ctx.guildDb.roles.muted)) return ctx.sendMsg(`That user is already muted.`);

    let time = ctx.interaction.options.getString('time'), duration = -1;
    if (time) {
      if(ctx.client.dhms(time) === 0) return ctx.sendMsg(`The relative timestamp provided was invalid.`);
      if(time.startsWith('perm')) {
        duration = -1;
        time = 'Permanent';
      }
      if(String(time).toLowerCase() !== 'Permanent') {
        duration = ctx.client.dhms(time);
        if(duration < 10000) return ctx.sendMsg(`You cannot mute someone for less than 10 seconds.`);
        if(duration > 604800000) return ctx.sendMsg(`You cannot mute someone for more than 7 days.`);
        time = ctx.client.duration(duration, { round: true });
      }
    }

    const caseId = ctx.generateCaseId();
    await ctx.guild.members.cache.get(user.id).roles.add(ctx.guildDb.roles.muted, `Case ID: ${caseId} | Moderator: ${ctx.author.tag} [${ctx.author.id}]`);

    let sentMsg = true;
    try {
      sentMsg = true;
      await user.send({
        embeds: [
          new ctx.MessageEmbed()
            .setTitle('You were muted')
            .setColor('ORANGE')
            .addField(`Guild`, `${ctx.guild.name.replace(/\`/, '\\`')}\n\`[${ctx.guild.id}]\``, true)
            .addField('Moderator', `${ctx.author.tag}\n\`[${ctx.author.id}]\``, true)
            .addField('Duration', `${time}`, true)
            .addField('Reason'.slice(0, 1000), reason)
            .setFooter(`This is an automated message. • Case ID: ${caseId}`)
        ]
      })
    } catch (err) {
      sentMsg = false;
    }

    let modlog = null;
    if (ctx.guildDb.logs.moderation) {
      modlog = await (await ctx.guild.channels.fetch(ctx.guildDb.logs.moderation)).send({
        embeds: [
          new ctx.MessageEmbed()
            .setAuthor(`${user.user.tag} was muted`, user.displayAvatarURL({ format: 'png' }))
            .setColor('ORANGE')
            .addField('Member', `<@${user.id}>\n(\`${user.user.tag}\`)`, true)
            .addField('Moderator', `<@${ctx.author.id}>\n(\`${ctx.author.tag}\`)`, true)
            .addField('Duration', `${time}`, true)
            .addField('Reason'.slice(0, 1000), reason)
            .setFooter(`Case ${caseId}`)
        ]
      }).catch((err) => null);
    }

    const caseLog = await ctx.database.cases.create({
      caseId, guildId: ctx.guild.id,
      moderator: { id: ctx.author.id, tag: ctx.author.tag },
      victim: { id: user.id, tag: user.user.tag },
      modlog: {
        channelId: modlog ? modlog.channel.id : null,
        messageId: modlog ? modlog.id : null
      },
      extras: {
        unmuteCheck: time !== "Permanent", 
        duration: time,
        expiresAt: time !== "Permanent" ? new Date(Date.now() + duration).toISOString() : null,
      },
      reason, type: 'mute',
      createdAt: new Date().toISOString(),
    });

    return ctx.sendMsg(new ctx.MessageEmbed().setDescription(`Muted <@${user.id}> with caseId \`${caseId}\` for \`${caseLog.extras.duration}\``).setColor('GREEN'));
  }
}