const { ShardingManager } = require('discord.js');
const config = require('./config.js');
const Statcord = require('statcord.js');

let manager = new ShardingManager('./bot.js', { totalShards: 'auto', token: config.token });

const statcord = new Statcord.ShardingClient({
  key: config.statcordKey, manager,
  postCpuStatistics: false, postMemStatistics: false, postNetworkStatistics: false
});

manager.on('shardCreate', (shard) => console.log(`Shard ${shard.id} launched`));
manager.spawn();
