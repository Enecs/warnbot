const Command = require('@structures/framework/Command');

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      description: 'The settings command for WarnBot.',
      options: [
        {
          name: "view",
          description: "View the full config.",
          type: 'SUB_COMMAND',
        },
        {
          name: "reset",
          description: "Reset the config to defaults.",
          type: 'SUB_COMMAND',
        },
        {
          name: "automod",
          description: "Configure the automod settings.",
          type: 'SUB_COMMAND_GROUP',
          options: [
            {
              name: "status",
              description: "View status of the entire auto-mod module.",
              type: 'SUB_COMMAND',
            },
            {
              name: "toggle",
              description: "Enable or disable the automod category.",
              type: 'SUB_COMMAND',
              options: [
                {
                  type: 'STRING',
                  name: 'value',
                  required: true,
                  description: 'The toggle.',
                  choices: [
                    { name: "enable", value: "enable" },
                    { name: "disable", value: "disable" },
                  ]
                },
              ]
            },
            {
              name: "feature",
              description: "Enable or disable the automod category.",
              type: 'SUB_COMMAND',
              options: [
                {
                  type: 'STRING',
                  name: 'item',
                  required: true,
                  description: 'The feature.',
                  choices: [
                    { name: "invites", value: "invites" },
                    { name: "scams", value: "scams" },
                    { name: "massmentions", value: "massmentions" },
                  ]
                },
                {
                  type: 'STRING',
                  name: 'switch',
                  required: true,
                  description: 'The toggle.',
                  choices: [
                    { name: "on", value: "on" },
                    { name: "off", value: "off" },
                  ]
                },
              ]
            },
          ]
        },
        {
          name: "log",
          description: "Configure the log channels.",
          type: 'SUB_COMMAND',
          options: [
            {
              type: 'STRING',
              name: 'type',
              required: true,
              description: 'The log type to edit.',
              choices: [
                { name: 'member', value: 'member' },
                { name: 'message', value: 'message' },
                { name: 'moderation', value: 'moderation' },
              ]
            },
            {
              type: 'CHANNEL',
              name: 'channel',
              required: true,
              description: 'The new channel for the type.',
              channel_types: [ 0 ]
            },
          ]
        },
        {
          name: "role",
          description: "Configure the roles.",
          type: 'SUB_COMMAND',
          options: [
            {
              type: 'STRING',
              name: 'type',
              required: true,
              description: 'The role type to edit.',
              choices: [
                { name: 'muted', value: 'muted' },
                { name: 'moderator', value: 'moderator' },
              ]
            },
            {
              type: 'ROLE',
              name: 'role',
              required: true,
              description: 'The new role for the type.',
            },
          ]
        },
      ],
      access: "administrator"
    })
  }
  async run(ctx) {
    const group = ctx.interaction.options._group, subcmd = ctx.interaction.options._subcommand;
    switch (group) {
      case 'automod':
        switch (subcmd) {
          case 'status': {
            const embed = new ctx.MessageEmbed()
              .setTitle('Automod')
              .setColor(ctx.client.color.primary)
              .setDescription(`Automod is currently ${ctx.guildDb.automod.enabled ? 'enabled' : 'disabled'}.\nTo edit the features, run \`/configure automod feature <item> <enable/disable>\`.`)
              .addField('Anti Invites', ctx.guildDb.automod.invites ? 'Enabled' : 'Disabled', true)
              .addField('Anti Scams', ctx.guildDb.automod.scams ? 'Enabled' : 'Disabled', true)
              .addField('Anti Mass Mentions', ctx.guildDb.automod.massmentions ? 'Enabled' : 'Disabled', true)
              .addField('Blacklisted Words', ctx.guildDb.automod.blacklistedwords ? 'Enabled' : 'Disabled', true);
            return ctx.sendMsg(embed);
          }
          case 'toggle': {
            const value = ctx.interaction.options.getString('value');
            if (value === 'enable') {
              await ctx.database.guilds.updateOne({ guildId: ctx.guild.id }, { $set: { automod: { "enabled": true } } });
              const embed = new ctx.MessageEmbed()
                .setTitle('Automod')
                .setColor(ctx.client.color.primary)
                .addField('Previous Value', ctx.guildDb.automod.enabled ? 'Enabled' : 'Disabled', true)
                .addField('New Value', 'Enabled', true)
              return ctx.sendMsg(embed);
            } 
            await ctx.database.guilds.updateOne({ guildId: ctx.guild.id }, { $set: { automod: { "enabled": false } } });
            const embed = new ctx.MessageEmbed()
              .setTitle('Automod')
              .setColor(ctx.client.color.primary)
              .addField('Previous Value', ctx.guildDb.automod.enabled ? 'Enabled' : 'Disabled', true)
              .addField('New Value', 'Disabled', true)
            return ctx.sendMsg(embed);
          }
          case 'feature': {
            const amFeature = ctx.interaction.options.getString('item'), amSwitch = ctx.interaction.options.getString('switch');
            if (amSwitch === 'on') {
              await ctx.database.guilds.updateOne({ guildId: ctx.guild.id }, { $set: { [`automod.${amFeature}`]: true } });
              return ctx.sendMsg('The feature has been enabled.');
            }
            await ctx.database.guilds.updateOne({ guildId: ctx.guild.id }, { $set: { [`automod.${amFeature}`]: false } });
            return ctx.sendMsg('The feature has been disabled.');
          }
        }
      
      default:
        switch (subcmd) {
          case 'view': {
            const embed = new ctx.MessageEmbed()
              .setColor(ctx.client.color.primary)
              .setTitle('Settings')
              .setDescription('Current configured settings')
              .addField('Logs', [
                `Moderation: ${ctx.guildDb.logs.moderation ? ` <#${ctx.guildDb.logs.moderation}>` : 'Not Configured'}`,
                `Member: ${ctx.guildDb.logs.member ? ` <#${ctx.guildDb.logs.member}>` : 'Not Configured'}`,
                `Message: ${ctx.guildDb.logs.message ? ` <#${ctx.guildDb.logs.message}>` : 'Not Configured'}`,
              ].join('\n'), true)
              .addField('Roles', [
                `Moderator: ${ctx.guildDb.roles.moderator ? ` <@&${ctx.guildDb.roles.moderator}>` : 'Not Configured'}`,
                `Muted: ${ctx.guildDb.roles.muted ? ` <@&${ctx.guildDb.roles.muted}>` : 'Not Configured'}`,
              ].join('\n'), true)
              .addField('Automod', [
                `Enabled: ${ctx.guildDb.automod.enabled ? 'Enabled' : 'Disabled'}`,
                `Invites: ${ctx.guildDb.automod.invites ? 'Enabled' : 'Disabled'}`,
                `Scams: ${ctx.guildDb.automod.scams ? 'Enabled' : 'Disabled'}`,
                `Mass Mentions: ${ctx.guildDb.automod.massmentions ? 'Enabled' : 'Disabled'}`,
                `Blacklisted Words: ${ctx.guildDb.automod.blacklistedwords ? 'Enabled' : 'Disabled'}`,
              ].join('\n'), true)
            return ctx.sendMsg(embed);
          }
          case 'reset': {
            const ireversableEmbed = new ctx.MessageEmbed()
              .setTitle('Reset')
              .setColor(ctx.client.color.primary)
              .setDescription('Are you sure you want to reset the settings? This cannot be reversed.')
              .setFooter('This will reset all settings to their default values.');
            const msg = await ctx.sendMsg(ireversableEmbed, {components: [{ type: 1, components: [
              {type: 2, style:3, customId: 'confirmation_yes', label:"Yes"}, 
              {type: 2, style:4, customId: 'confirmation_no', label:"No"}
            ]}] });

            const filter = (interaction) => interaction.customId.startsWith('confirmation_') && interaction.user.id === ctx.interaction.user.id && interaction.message.id == msg.id;
            const collector = msg.channel.createMessageComponentCollector({ filter, time: 35000 });

            collector.on('end', (_, action) => {
              if (action === 'yes') return;
              ctx.sendMsg(new ctx.MessageEmbed().setTitle('Reset Cancelled').setTitle("Okay, I wont reset the server's settings.").setColor('RED'), {components:[],message:msg});
            })
            collector.on('collect', async (interaction) => {
              interaction.deferUpdate();
              switch (interaction.customId) {
                case "confirmation_yes": {
                  collector.stop('yes');
                  await ctx.database.guilds.deleteOne({ guildId: ctx.guild.id });
                  ctx.sendMsg(new ctx.MessageEmbed().setTitle('Reset Success').setTitle("The server's settings were reset!").setColor('GREEN'), {components:[],message:msg});
                  return;
                }
                case "confirmation_no": return collector.stop();
                default: return;
              }
            })
            break;
          }
          case 'log': {
            const type = ctx.interaction.options.getString('type'), channel = ctx.interaction.options.getChannel('channel');
            if (type === 'member') {
              await ctx.database.guilds.updateOne({ guildId: ctx.guild.id }, { $set: { [`logs.${type}`]: channel.id } });
              return ctx.sendMsg(`The member log has been set to ${channel.name}`);
            } else if (type === 'message') {
              await ctx.database.guilds.updateOne({ guildId: ctx.guild.id }, { $set: { [`logs.${type}`]: channel.id } });
              return ctx.sendMsg(`The message log has been set to ${channel.name}`);
            } else if (type === 'moderation') {
              await ctx.database.guilds.updateOne({ guildId: ctx.guild.id }, { $set: { [`logs.${type}`]: channel.id } });
              return ctx.sendMsg(`The moderation log has been set to ${channel.name}`);
            }
            return ctx.sendMsg('Invalid type.');
          }
          case 'role': {
            const type = ctx.interaction.options.getString('type'), role = ctx.interaction.options.getRole('role');
            if (type === 'muted') {
              if (ctx.guild.id === role.id) {
                await ctx.database.guilds.updateOne({ guildId: ctx.guild.id }, { $set: { [`roles.${type}`]: null } });
                return ctx.sendMsg(`The muted role has been cleared.`, {allowedMentions: {parse: []}});
              }
              await ctx.database.guilds.updateOne({ guildId: ctx.guild.id }, { $set: { [`roles.${type}`]: role.id } });
              return ctx.sendMsg(`The muted role has been set to ${role.name}`, {allowedMentions: {parse: []}});
            } else if (type === 'moderator') {
              if (ctx.guild.id === role.id) {
                await ctx.database.guilds.updateOne({ guildId: ctx.guild.id }, { $set: { [`roles.${type}`]: null } });
                return ctx.sendMsg(`The moderator role has been cleared.`, {allowedMentions: {parse: []}});
              }
              await ctx.database.guilds.updateOne({ guildId: ctx.guild.id }, { $set: { [`roles.${type}`]: role.id } });
              return ctx.sendMsg(`The moderator role has been set to ${role.name}`, {allowedMentions: {parse: []}});
            }
            return ctx.sendMsg('Invalid type.');
          }
        }
    }
  }
}