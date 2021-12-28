const Command = require('@structures/framework/Command');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      description: 'Warn a user.',
      options: [
        {
          type: 'USER',
          name: "user",
          description: "The user to warn.",
          required: true,
        },
        {
          type: 'STRING',
          name: "reason",
          description: "The reason for the warning.",
          required: true,
        },
      ],
      access: "moderator"
    })
  }

  async run(ctx) {
    const user = ctx.interaction.options.getMember('user'), reason = ctx.interaction.options.getString('reason') || 'No reason provided.';
    if (!ctx.guild.me.permissions.has('MANAGE_ROLES')) return ctx.sendMsg('I do not have the `MANAGE_ROLES` permission.');
    if (!ctx.guildDb.roles.muted) return ctx.sendMsg(`Please setup the muted role using \`/configure role type: muted\``);

    if (user.id === ctx.client.user.id) return ctx.sendMsg(`Why would I warn myself?`);
    
    const caseId = ctx.generateCaseId();

    let sentMsg = true;
    try {
      sentMsg = true;
      await user.send({
        embeds: [
          new ctx.MessageEmbed()
            .setTitle('You were warned')
            .setColor('GOLD')
            .addField(`Guild`, `${ctx.guild.name.replace(/\`/, '\\`')}\n\`[${ctx.author.id}]\``, true)
            .addField('Moderator', `${ctx.author.tag}\n\`[${ctx.author.id}]\``, true)
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
            .setAuthor(`${user.user.tag} was warned`, user.displayAvatarURL({ format: 'png' }))
            .setColor('GOLD')
            .addField('Member', `<@${user.id}>\n(\`${user.user.tag}\`)`, true)
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
      reason, type: 'warn',
      createdAt: new Date().toISOString(),
    });

    return ctx.sendMsg(new ctx.MessageEmbed().setDescription(`Warned <@${user.id}> with caseId \`${caseId}\``).setColor('GREEN'));
  }
}