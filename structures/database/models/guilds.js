const { model, Schema } = require("mongoose");

const modelSchema = new Schema({
  guildId: { type: String, default: null, },
  lang: { type: String, default: "en", 
    enum: {
      values: ["en"],
      message: "{VALUE} is not valid"
    }
  },
  automod: {
    enabled: { type: Boolean, default: false },
    invites: { type: Boolean, default: false },
    scams: { type: Boolean, default: false },
    massmentions: { type: Boolean, default: false },
    blacklistedwords: { type: Boolean, default: false },
  },
  roles: {
    muted: { type: String, default: null },
    moderator: { type: String, default: null },
  },
  logs: {
    member: { type: String, default: null },
    message: { type: String, default: null },
    moderation: { type: String, default: null },
  }
});

module.exports = {
  schema: modelSchema,
  model: model("guilds", modelSchema),
};