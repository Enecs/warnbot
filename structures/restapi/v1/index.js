const { Router } = require("express");
const Discord = require('discord.js');

const route = Router();

route.get('/stats', async (req, res, next) => {
  let redisStats = await req.redis.get(`${req.client.config.redis.prefix}STATS`);
  if(redisStats) redisStats = JSON.parse(redisStats);
  else {
    const guildCount = await req.client.shard.fetchClientValues('guilds.cache.size')
    const ping = await req.client.shard.fetchClientValues('ws.ping')
    const users = await req.client.shard.broadcastEval(() => this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0));

    let shards = [];
    guildCount.map((count, shardId) => {
      shards.push({
        id: shardId, 
        guilds: count,
        users: users[shardId], 
        ping: ping[shardId],
      })
    });
    redisStats = {
      version: {
        nodejs: process.version,
        discordjs: "v"+Discord.version,
      },
      shards: shards,
      total: {
        guilds: guildCount.reduce((servers, num) => num + servers, 0),
        users: users.reduce((users, num) => num + users, 0),
        ping: Math.round(ping.reduce((users, num) => num + users, 0) / ping.length)
      }
    };
    await req.redis.setex(`${req.client.config.redis.prefix}STATS`, 2 * 60, JSON.stringify(redisStats))
  }
  res.json(redisStats)
})

route.get('/commands', async (req,res,next) => {
  let redisCommands = await req.redis.get(`${req.client.config.redis.prefix}COMMANDS`);
  if(redisCommands) redisCommands = JSON.parse(redisCommands)
  else {
    const myCommands = req.client.commands.sort((a,b) => a.help.name.localeCompare(b.help.name)).sort((a,b) => a.help.category.localeCompare(b.help.category)), commands = { catedCommands: {}, commandsArray: [], categories: [] };
  
    for (const [,command] of myCommands) {
      const category = command.help.category, help = Object.assign(command.help, { aliases: command.conf.aliases, options: command.conf.options });
      if(category != 'System') {
        commands.commandsArray.push(help);
        commands.catedCommands[category] ? commands.catedCommands[category].push(help) : (commands.catedCommands[category] = [help]);
      }
    }
    commands.categories = [...new Set(commands.commandsArray.map(x => x.category))].sort((a, b) => a.localeCompare(b));
    redisCommands = commands;
    await req.redis.setex(`${req.client.config.redis.prefix}COMMANDS`, 10 * 60, JSON.stringify(redisCommands))
  }
  return res.status(200).json(redisCommands);
})

module.exports = route;
