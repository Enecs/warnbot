module.exports = class AccessLevels {
  constructor(client) {
    this.client = client;

    this.access = [
      {name: "user", level: 0},
      {name: "moderator", level: 1},
      {name: "administrator", level: 2},
      {name: "owner", level: 3},
      {name: "developer", level: 99},
    ];
  }

  getAccess(member, guildDb = null) {
    if(this.client.config.admins.includes(member.id)) return this.access.find(m=>m.name==="developer");
    if(guildDb) {
      if(member.id === member.guild.ownerId) return this.access.find(m=>m.name==="owner");
      if(member.permissions.has('MANAGE_GUILD')) return this.access.find(m=>m.name==="administrator");
      if(guildDb.roles.moderator && member.roles.cache.has(guildDb.roles.moderator)) return this.access.find(m=>m.name==="moderator");
    }
    return this.access.find(m=>m.name==="user");
  }

  checkAccess(member, guildDb = null, accessLevel = 'user') {
    const currentAccess = this.getAccess(member, guildDb);
    const lookingFor = this.access.find(m=>m.name===accessLevel||m.level===accessLevel);
    if(currentAccess.level >= lookingFor.level) return true;
    return false;
  }
}