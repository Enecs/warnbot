const Command = require('@structures/framework/Command');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      description: 'Unmutes a user.',
      options: [
        {
          type: 'USER',
          name: "user",
          description: "The user to unmute.",
          required: true,
        },
        {
          type: 'STRING',
          name: "reason",
          description: "The reason for the unmute.",
        },
      ],
      access: "moderator"
    })
  }

  async run(ctx) {
    const user = ctx.interaction.options.getMember('user'), reason = ctx.interaction.options.getString('reason') || 'No reason provided.';
    if (!ctx.guild.me.permissions.has('MANAGE_ROLES')) return ctx.sendMsg('I do not have the `MANAGE_ROLES` permission.');
    if (!ctx.guildDb.roles.muted) return ctx.sendMsg(`Please setup the muted role using \`/configure role type:muted\``);

    if (user.id === ctx.client.user.id) return ctx.sendMsg(`Why would I need to unmute myself?`);
    if (user.id === ctx.guild.ownerId) return ctx.sendMsg(`The owner cant be muted so why would they need an unmute?`);
    if (!ctx.guild.members.cache.get(user.id).roles.cache.has(ctx.guildDb.roles.muted)) return ctx.sendMsg(`That user is not muted.`);
    
    const caseId = ctx.generateCaseId();
    await ctx.guild.members.cache.get(user.id).roles.remove(ctx.guildDb.roles.muted, `Case ID: ${caseId} | Moderator: ${ctx.author.tag} [${ctx.author.id}]`);

    let modlog = null;
    if (ctx.guildDb.logs.moderation) {
      modlog = await (await ctx.guild.channels.fetch(ctx.guildDb.logs.moderation)).send({
        embeds: [
          new ctx.MessageEmbed()
            .setAuthor(`${user.user.tag} was unmuted`, user.displayAvatarURL({ format: 'png' }))
            .setColor('GREEN')
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
      victim: { id: user.id, tag: user.user.tag },
      modlog: {
        channelId: modlog ? modlog.channel.id : null,
        messageId: modlog ? modlog.id : null
      },
      reason, type: 'unmute',
      createdAt: new Date().toISOString(),
    });
    
    await ctx.database.cases.updateOne({ guildId: ctx.guild.id, type: 'mute', "victim.id": user.id, "extras.unmuteCheck": true }, { $set: { "extras.unmuteCheck": false, "extras.undo.caseId": caseId } })

    return ctx.sendMsg(new ctx.MessageEmbed().setDescription(`Unmuted <@${user.id}> with caseId \`${caseId}\``).setColor('GREEN'));
  }
}