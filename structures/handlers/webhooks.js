const WebhookClient = require('@structures/framework/WebhookClient');
module.exports = class WebhookManager {
  constructor(client) {
    this.client = client;

    for(let webhook of client.config.webhooks) this[webhook.name] = new WebhookClient(this.client, webhook);
  }
}