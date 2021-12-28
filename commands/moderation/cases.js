const Command = require('@structures/framework/Command');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      description: 'View cases.',
      options: [
        {
          type: 'SUB_COMMAND',
          name: 'user',
          description: `View a user's cases.`,
          options: [
            {
              type: 'USER',
              name: "user",
              description: `The user's cases you want to see.`,
              required: true,
            }
          ]
        },
        {
          type: 'SUB_COMMAND',
          name: 'guild',
          description: `View the guild's cases.`,
          options: [
            {
              type: 'USER',
              name: "moderator",
              description: `Filter by moderator.`,
            },
          ]
        }
      ]
    })
  }

  async run(ctx) {
    const subcmd = ctx.interaction.options._subcommand;

    switch (subcmd) {
      case 'user': {
        const user = ctx.interaction.options.getUser('user');
        const cases = await ctx.client.database.cases.find({ guild: ctx.guild.id, "victim.id": user.id });
        if (!cases) return ctx.sendMsg('No cases found.');
        
        return ctx.pagify(generateCaseEmbeds(cases, user.tag, user.displayAvatarURL({format:'png'}), ctx.client.color.primary, ctx.MessageEmbed));
      }

      case 'guild': {
        const moderator = ctx.interaction.options.getUser('moderator');
        const guildCases = moderator 
          ? await ctx.client.database.cases.find({ guild: ctx.guild.id, "moderator.id": moderator.id })
          : await ctx.client.database.cases.find({ guild: ctx.guild.id });
        if (!guildCases) return ctx.sendMsg('No cases found.');

        return ctx.pagify(generateCaseEmbeds(guildCases, ctx.guild.name, ctx.guild.iconURL({format: 'png'}), ctx.client.color.primary, ctx.MessageEmbed));
      }
    }
  }
}

function generateCaseEmbeds(cases, authorName, authorIcon, embedColor, MessageEmbed) {
  const embeds = [];
  for (let i = 0; i < cases.length; i += 5) {
    const current = cases.slice(i, i+5);

    const embed = new MessageEmbed()
      .setAuthor(`${authorName} | ${cases.length} Total Cases`, authorIcon)
      .setColor(embedColor)
    current.map((currentCase) => {
      let data = [
        `**User:** ${currentCase.victim.tag} [\`${currentCase.victim.id}\`]`,
        `**Reason:** ${currentCase.reason}`,
        currentCase.type === "mute" ? `**Duration:** ${currentCase.extras.duration} [<t:${Math.round(new Date(currentCase.extras.expiresAt).getTime()/1000)}:f>]` : null,
        `**Staff Member:** ${currentCase.moderator.tag} [\`${currentCase.moderator.id}\`]`,
        `**Date:** <t:${Math.round(new Date(currentCase.createdAt).getTime()/1000)}:f>`,
      ];
      embed.addField(`Case #${currentCase.caseId} - \`${currentCase.type}\``, data.filter(m=>m).map(m => `- ${m}`).join('\n'))
    })
    embeds.push(embed);
  }
  return embeds;
}