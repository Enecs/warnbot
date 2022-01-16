require("module-alias/register");

// Load up the Client
// const { CLIENT_OPTIONS } = require('@modules/constants.js');
const BotClient = require('@structures/bot/Client.js');
const client = new BotClient({ 
  intents: [
    'GUILDS', 'GUILD_BANS',
    'GUILD_EMOJIS_AND_STICKERS',
    'GUILD_INTEGRATIONS', 'GUILD_WEBHOOKS',
    'GUILD_INVITES', 'DIRECT_MESSAGES',
    // 'GUILD_MEMBERS', 'GUILD_MESSAGES', // Priviledged (Needs Verification)
  ]
});

client.login(client.config.token);

client.on("disconnect", () => client.logger.log("Bot is disconnecting...", "warn"))
  .on("reconnecting", () => client.logger.log("Bot reconnecting...", "log"))
  .on("error", error => this.client.logger.log(error, "error"));

/* MISCELANEOUS NON-CRITICAL FUNCTIONS */

// <String>.toPropercase() returns a proper-cased string such as: 
// "Mary had a little lamb".toProperCase() returns "Mary Had A Little Lamb"
String.prototype.toProperCase = function () {
  return this.replace(/(\b\w)/g, w => w.toUpperCase());
};
// <Array>.random() returns a single random element from an array
// [1, 2, 3, 4, 5].random() can return 1, 2, 3, 4 or 5.
Array.prototype.random = function () {
  return this[~~(Math.random() * this.length)];
};

// These 2 process methods will catch exceptions and give *more details* about the error and stack trace.
process.on("uncaughtException", (err) => {
  const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
  console.error("Uncaught Exception: ", errorMsg);
  client.webhooks.error.send({content: `**${client.user.username} - uncaughtException:**\n\`\`\`\n${err.stack}`.slice(0,1995)+'\`\`\`' })
  // process.exit(1);
});

process.on("unhandledRejection", err => {
  console.error("Uncaught Promise Error: ", err);
  client.webhooks.error.send({content: `**${client.user.username} - unhandledRejection:**\n\`\`\`\n${err.stack}`.slice(0,1995)+'\`\`\`' })
});
