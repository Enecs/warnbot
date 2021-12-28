const Discord = require('discord.js');
const path = require('path');
const fs = require('fs');

module.exports = class BotClient extends Discord.Client {
  constructor(options) {
    super(options);

    // Configuration
    this.config = require('@root/config');

    // Collections
    for (const name of ["commands", "events", "cooldowns"]) this[name] = new Discord.Collection();

    // Packages
    this.discord = Discord;
    this.fs = fs;
    this.moment = require('moment'); require("moment-timezone"); require("moment-duration-format");
    this.duration = require("humanize-duration");
    this.Hashids = require("hashids/cjs");
    this.dhms = require('dhms');
    this.statcord = require('statcord.js');

    // Bot Colors
    this.color = {
      "primary": "#6494F4",
      "secondary": "#64B3F4",
      "success": "GREEN",
      "error": 'RED',
      "warning": 'ORANGE',
      "info": 'BLUE',
    };
    
    // Databases
    this.database = new (require('@structures/database/Database.js'))(this);
    this.redis = new (require('ioredis'))(`redis://${this.config.redis.host}:${this.config.redis.port}`);

    // Miscelaneous
    this.webhooks = new (require('@structures/handlers/webhooks.js'))(this);
    this.punishments = new (require('@structures/handlers/punishments.js'))(this);
    this.accesslevels = new (require('@structures/handlers/accessLevels.js'))(this);

    this.load();
  }

  load() {
    this.loadFolder('./commands', async (file) => {
      const prop = new (require(file))(this);
      if (!prop.enabled) return;
      prop.commandData.name = file.split('/').pop().split('.')[0].replace(/.js$/,'');
      if (prop.init) await prop.init(this);
      this.commands.set(prop.commandData.name, prop);
      console.log(`Loaded command: ${prop.commandData.name}`);
    });
    this.loadFolder('./events', async (file) => {
      const prop = new (require(file))(this);
      if (!prop.enabled) return;
      prop.name = file.split('/').pop().split('.')[0].replace(/.js$/,'');
      if (prop.init) await prop.init(this);
      this.events.set(prop.name, prop);
      this.on(prop.name, (...args) => prop.run(this, ...args));
      console.log(`Loaded event: ${prop.name}`);
    });
  }

  loadFolder(folder, cb) {
    let joined;
    for (const entry of fs.readdirSync(folder.replace('.', process.cwd()))) {
      joined = path.join(folder, entry);
      if (fs.lstatSync(joined).isDirectory()) this.loadFolder(joined, cb);
      else cb(path.join(process.cwd(),joined))
    }
    return true;
  }
}