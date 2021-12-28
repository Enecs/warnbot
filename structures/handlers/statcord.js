const Statcord = require('statcord.js');

module.exports = class StatcordManager {
  constructor(client) {
    this.client = client;

    this.statcord = new Statcord.Client({
      key: this.client.config.statcordKey,
      client: this.client,
      postCpuStatistics: false, postMemStatistics: false, postNetworkStatistics: false
    });
  }
}