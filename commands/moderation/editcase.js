const Command = require('@structures/framework/Command');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      description: 'View cases.',
      options: [
        {
          type: 'STRING',
          name: "caseid",
          description: `The caseid to edit.`,
          required: true,
        },
        {
          type: "STRING",
          name: "type",
          description: `What would you like to edit?`,
          required: true,
          choices: [
            { name: "reason", value: "reason" },
            { name: "duration", value: "duration" },
          ]
        },
        {
          type: "STRING",
          name: "value",
          description: `What would you like to change it to?`,
          required: true,
        }
      ]
    })
  }

  async run(ctx) {
    const caseId = ctx.interaction.options.getString('caseid'), type = ctx.interaction.options.getString('type'), value = ctx.interaction.options.getString('value').slice(0, 1000);
    const caseData = await ctx.client.database.cases.findOne({ guild: ctx.guild.id, caseId: caseId });
    if (!caseData) return ctx.send("That case doesn't exist.");
    
    if (type === "reason") {
      await ctx.client.database.cases.updateOne({ _id: caseData._id }, { $set: { reason: value } });

      let updateModLog = true;
      try {
        const modlog = await (await ctx.guild.channels.fetch(caseData.modlog.channelId)).messages.fetch(caseData.modlog.messageId);
        const embed = modlog.embeds[0];
        embed.fields[3].value = value;
        modlog.edit({ embeds: [embed] });
      } catch (err) {
        updateModLog = false;
      }

      return ctx.sendMsg(`The reason has been updated. The mod log was ${updateModLog ? 'updated' : 'unable to be updated'}.`);
    } else if (type === "duration") {
      if(caseData.type !== "mute") return ctx.sendMsg("You can only edit the duration of a mute case.");
      if(!caseData.extras.unmuteCheck && caseData.extras.duration !== "Permanent") return ctx.sendMsg("You may only edit a mute case that is still active.");

      let time = value, duration = -1;
      if (time) {
        if(ctx.client.dhms(time) === 0) return ctx.sendMsg(`The relative timestamp provided was invalid.`);
        if(time.startsWith('perm')) {
          duration = -1;
          time = "Permanent";
        }
        if(String(time).toLowerCase() !== 'Permanent') {
          duration = ctx.client.dhms(time);
          if(duration < 10000) return ctx.sendMsg(`You cannot mute someone for less than 10 seconds.`);
          if(duration > 604800000) return ctx.sendMsg(`You cannot mute someone for more than 7 days.`);
          time = ctx.client.duration(duration, { round: true });
        }
      }

      await ctx.client.database.cases.updateOne({ _id: caseData._id }, { $set: { 
        "extras.unmuteCheck": time !== "Permanent", 
        "extras.duration": time, 
        "extras.expiresAt": time !== "Permanent" ? new Date(new Date(caseData.createdAt).getTime() + duration).toISOString() : null 
      } });
      

      let updateModLog = true;
      try {
        const modlog = await (await ctx.guild.channels.fetch(caseData.modlog.channelId)).messages.fetch(caseData.modlog.messageId);
        const embed = modlog.embeds[0];
        embed.fields[2].value = time;
        modlog.edit({ embeds: [embed] });
      } catch (err) {
        updateModLog = false;
      }


      return ctx.sendMsg(`The case (\`${caseData.caseId}\`) duration has been updated. The mod log was ${updateModLog ? 'updated' : 'unable to be updated'}.`);
    }

  }
}