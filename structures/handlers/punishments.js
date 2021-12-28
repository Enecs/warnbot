module.exports = class PunishmentManager {
  constructor(client) {
    this.client = client;
    this.interval = null;
  }
  
  load() {
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => this.___intervalRun(), 5000);
  }

  generateCaseId() {
    return new this.client.Hashids(
      this.client.moment().format('SSMMHH') + 
      this.client.moment().format('DDMMYYYY') + 
      new Date().toISOString(), 3
    ).encode(1, 3, 7);
  }

  ___intervalRun() {
    this.muteCheck();
    // TODO: Add TempBan & Add tempban check
  }

  async muteCheck() {
    const db = await this.client.database.cases.find({
      type: "mute",
      "extras.unmuteCheck": true,
    });

    let databaseUpdates = [];
    for (const mute of db) {
      if(!(new Date(mute.extras.expiresAt).getTime() <= Date.now())) continue;

      // Ensure user is still in the guild.
      const guild = await this.client.guilds.cache.get(mute.guildId);
      const user = await guild.members.fetch(mute.victim.id);
      if(!user) continue;

      // Process the unmute for that user.
      const caseId = this.generateCaseId();
      const guildDb = await this.client.database.guilds.findOne({ guildId: mute.guildId });
      user.roles.remove(guildDb.roles.muted, `Case ID: ${caseId} | Automatic unmute`);

      // Send the mod log.
      let modlog = null;
      if (guildDb.logs.moderation) {
        modlog = await (await guild.channels.fetch(guildDb.logs.moderation)).send({
          embeds: [
            new this.client.discord.MessageEmbed()
              .setAuthor(`[AUTOMATIC] ${user.user.tag} was unmuted`, user.displayAvatarURL({ format: 'png' }))
              .setColor('GREEN')
              .addField('Member', `<@${user.id}>\n(\`${user.user.tag}\`)`, true)
              .addField('Moderator', `<@${mute.moderator.id}>\n(\`${mute.moderator.tag}\`)`, true)
              .addField('Reason'.slice(0, 1000), mute.reason)
              .setFooter(`Case ${caseId}`)
          ]
        }).catch((err) => null)
      }

      await this.client.database.cases.create({
        caseId, guildId: guild.id,
        moderator: mute.moderator,
        victim: { id: user.id, tag: user.user.tag },
        modlog: {
          channelId: modlog ? modlog.channel.id : null,
          messageId: modlog ? modlog.id : null
        },
        reason: mute.reason, type: 'unmute',
        "extras.muteCaseId": mute.caseId,
        createdAt: new Date().toISOString(),
      });

      // Update the database records.
      await databaseUpdates.push({updateOne:{ filter: { _id: mute._id }, update: { $set: { 
        "extras.unmuteCheck": false, "extras.unmuteCaseId": caseId, 
        "extras.unmutedAt": new Date().toISOString() 
      } } }});
    }

    this.client.database.cases.bulkWrite(databaseUpdates);
  }

}